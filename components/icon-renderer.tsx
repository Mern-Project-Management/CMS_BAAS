'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { 
  FaRegAddressBook, FaRegAddressCard, FaRegLaugh, FaRegHeart, FaRegLightbulb, 
  FaRegMap, FaRegUser, FaRegEnvelope, FaRegCalendarAlt, FaRegFileAlt, FaRegStar, 
  FaRegThumbsUp, FaRegSmile, FaRegFrown, FaRegMeh, FaRegGem, FaRegFlag, 
  FaRegTrashAlt, FaRegEdit, FaRegCheckCircle, FaRegTimesCircle 
} from 'react-icons/fa';
import { 
  MdEmojiEmotions, MdEmojiObjects, MdEmojiSymbols, MdEmojiTransportation, 
  MdEmojiFoodBeverage, MdEmojiNature, MdEmojiEvents, MdEmojiPeople 
} from 'react-icons/md';

interface IconRendererProps {
  icon: string;
  className?: string;
}

export function IconRenderer({ icon, className = '' }: IconRendererProps) {
  if (!icon) return null;

  // Render Iconify icons (e.g. "lucide:home" or "mdi-account")
  if (icon.includes(':')) {
    return <Icon icon={icon} className={className} />;
  }

  // Convert PascalCase Lucide icons to kebab-case Iconify format
  // e.g. "ShoppingBag" -> "lucide:shopping-bag"
  if (/^[A-Z][a-zA-Z0-9]+$/.test(icon) && !icon.startsWith('Fa') && !icon.startsWith('Md')) {
    const kebab = icon
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();
    return <Icon icon={`lucide:${kebab}`} className={className} />;
  }

  // Render Emojis (single character or emoji)
  // Simplified check: if it's 1-2 characters, it's likely an emoji
  if (icon.length <= 2) {
    return <span className={className}>{icon}</span>;
  }

  // Render Legacy react-icons
  const faIcons: Record<string, React.ElementType> = {
    FaRegAddressBook, FaRegAddressCard, FaRegLaugh, FaRegHeart, FaRegLightbulb,
    FaRegMap, FaRegUser, FaRegEnvelope, FaRegCalendarAlt, FaRegFileAlt, FaRegStar,
    FaRegThumbsUp, FaRegSmile, FaRegFrown, FaRegMeh, FaRegGem, FaRegFlag,
    FaRegTrashAlt, FaRegEdit, FaRegCheckCircle, FaRegTimesCircle,
  };

  const mdIcons: Record<string, React.ElementType> = {
    MdEmojiEmotions, MdEmojiObjects, MdEmojiSymbols, MdEmojiTransportation,
    MdEmojiFoodBeverage, MdEmojiNature, MdEmojiEvents, MdEmojiPeople,
  };

  const Component = faIcons[icon] || mdIcons[icon];
  if (Component) {
    return <Component className={className} />;
  }

  // Fallback
  return <span className={className}>{icon}</span>;
}
