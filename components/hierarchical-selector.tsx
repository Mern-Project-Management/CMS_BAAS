/**
 * Hierarchical Selector Component
 * Use this to allow users to select from a hierarchical relationship
 * 
 * Example:
 * <HierarchicalSelector
 *   collectionId="categories_id"
 *   onSelect={handleCategorySelect}
 *   label="Select Category"
 * />
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HierarchyNode {
  id: string;
  label: string;
  depth: number;
  raw: any;
  path: any[];
  children?: HierarchyNode[];
}

interface Props {
  collectionId: string;
  onSelect: (recordId: string, record?: any) => void;
  label?: string;
  placeholder?: string;
  excludeIds?: string[];
  parentFieldName?: string;
  includeRootLevel?: boolean;
  value?: string;
}

function resolveNodeLabel(node: any) {
  return (
    node.display_name ||
    node.name ||
    node.category_name ||
    node.category ||
    node.title ||
    node.category_slug ||
    node.slug ||
    node.id ||
    'Unnamed item'
  );
}

/**
 * Builds a tree structure with hierarchy preserved
 */
function buildTree(
  nodes: any[],
  excludeIds: string[] = [],
  currentPath: any[] = []
): HierarchyNode[] {
  return nodes
    .filter(node => !excludeIds.includes(String(node.id)))
    .map(node => {
      const nodePath = [...currentPath, node];
      return {
        id: String(node.id),
        label: resolveNodeLabel(node),
        depth: nodePath.length - 1,
        raw: node,
        path: nodePath,
        children:
          node.children && Array.isArray(node.children)
            ? buildTree(node.children, excludeIds, nodePath)
            : [],
      };
    });
}

function buildTreeFromFlatList(
  nodes: any[],
  parentFieldName: string,
  excludeIds: string[] = []
) {
  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

  const normalizeId = (value: any) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object' && value !== null) {
      if ('$oid' in value) return String(value.$oid);
      if ('id' in value) return String(value.id);
      return String(value);
    }
    return String(value);
  };

  const findParentKey = (node: any) => {
    if (parentFieldName in node) return parentFieldName;
    const candidate = Object.keys(node).find((key) =>
      key !== 'id' && key.startsWith('parent_')
    );
    return candidate || parentFieldName;
  };

  const getParentId = (node: any) => {
    const key = findParentKey(node);
    return normalizeId(node[key]);
  };

  nodes.forEach((node) => {
    if (!excludeIds.includes(String(node.id))) {
      nodeMap.set(String(node.id), { ...node, children: [] });
    }
  });

  nodeMap.forEach((node) => {
    const parentId = getParentId(node);
    const parent = parentId ? nodeMap.get(parentId) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function HierarchicalSelector({
  collectionId,
  onSelect,
  label,
  placeholder = 'Select an item...',
  excludeIds = [],
  parentFieldName = 'parent_id',
  includeRootLevel = true,
  value,
}: Props) {
  const [tree, setTree] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHierarchy();
  }, [collectionId, parentFieldName]);

  async function fetchHierarchy() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      console.log(`[HierarchicalSelector] Fetching hierarchy for ${collectionId} using field: ${parentFieldName}`);

      if (parentFieldName !== 'parent_id') {
        params.append('parentField', parentFieldName);
      }

      const res = await fetch(
        `/api/hierarchies/${collectionId}?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch hierarchy');
      }

      const json = await res.json();
      console.log('[HierarchicalSelector] Raw API Response:', json);

      if (!json.success) {
        throw new Error(json.error || 'Unknown error');
      }

      const apiData = Array.isArray(json.data) ? json.data : [];
      const hasNestedChildren = apiData.some(
        (item: any) => item.children && Array.isArray(item.children) && item.children.length > 0
      );

      const normalizedTree = hasNestedChildren
        ? buildTree(apiData, excludeIds, [])
        : buildTree(buildTreeFromFlatList(apiData, parentFieldName, excludeIds), excludeIds, []);

      console.log('[HierarchicalSelector] Tree Data:', normalizedTree);
      setTree(normalizedTree);
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
      setError(err instanceof Error ? err.message : 'Error loading hierarchy');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedLabel = useMemo(() => {
    const findNode = (nodes: HierarchyNode[]): HierarchyNode | undefined => {
      for (const node of nodes) {
        if (node.id === value) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const selected = findNode(tree);
    if (!selected) return '';
    
    // Show full path for selected item in the trigger (e.g. Bags > School Bag)
    if (selected.path && selected.path.length > 1) {
      return selected.path.map(p => resolveNodeLabel(p)).join(' > ');
    }
    return selected.label;
  }, [tree, value]);

  const renderTreeItems = (nodes: HierarchyNode[]): React.ReactNode[] => {
    return nodes
      .filter((item) => (!includeRootLevel ? item.depth > 0 : true))
      .flatMap((item) => {
        const paddingLeft = Math.min(24 + item.depth * 16, 72);

        const itemElement = (
          <SelectItem
            key={item.id}
            value={item.id}
            className="relative py-2 pr-2 text-sm text-black focus:bg-accent focus:text-black"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <div className="flex items-center gap-2 truncate">
              {item.depth > 0 ? (
                <span className="text-muted-foreground text-xs">↳</span>
              ) : (
                <span className="inline-block w-3" />
              )}
              <span
                className={`truncate ${
                  item.depth === 0
                    ? 'font-semibold text-black'
                    : 'font-normal text-sm text-foreground'
                }`}
              >
                {item.label}
              </span>
              {item.children && item.children.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.children.length} child{item.children.length > 1 ? 'ren' : ''}
                </span>
              )}
            </div>
          </SelectItem>
        );

        const childrenElements = item.children && item.children.length > 0
          ? renderTreeItems(item.children)
          : [];

        return [itemElement, ...childrenElements];
      });
  };

  const findNodeInTree = (nodes: HierarchyNode[], id: string): HierarchyNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeInTree(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-black">{label}</label>}
      <Select value={value} onValueChange={(val) => {
        const selectedNode = findNodeInTree(tree, val);
        onSelect(val, selectedNode?.path);
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedLabel || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tree.length === 0 ? (
            <div className="p-2 text-sm text-black/60">
              No items available
            </div>
          ) : (
            renderTreeItems(tree)
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
