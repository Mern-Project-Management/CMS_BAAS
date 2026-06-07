import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const COLORS_FILE = join(process.cwd(), '..', 'bexon', 'src', 'app', 'assets', 'sass', 'utilities', '_colors.scss');

// Color palette structure
interface ColorPalette {
  common: { white: string; black: string };
  heading: { primary: string };
  text: {
    body: string;
    body2: string;
    body3: string;
    body4: string;
    body5: string;
  };
  theme: {
    primary: string;
    bg: string;
    bg2: string;
    bg3: string;
    dark: string;
    dark2: string;
    dark3: string;
    dark4: string;
    dark5: string;
  };
  grey: { 1: string; 2: string; 3: string };
  border: { 1: string; 2: string; 3: string; 4: string; 5: string };
}

// Default colors
const defaultColors: ColorPalette = {
  common: {
    white: '#ffffff',
    black: '#000000',
  },
  heading: {
    primary: '#0c1e21',
  },
  text: {
    body: '#364e52',
    body2: '#a9b8b8',
    body3: '#67787a',
    body4: '#18292c',
    body5: '#ffffffcc',
  },
  theme: {
    primary: '#1e8a8a',
    bg: '#d8e5e5',
    bg2: '#cee0e0',
    bg3: '#202e30',
    dark: '#0c1e21',
    dark2: '#18292c',
    dark3: '#364e52',
    dark4: '#67787a',
    dark5: '#676e7a',
  },
  grey: {
    1: '#ecf0f0',
    2: '#a9b8b8',
    3: '#ffffff1a',
  },
  border: {
    1: '#c9d1d1',
    2: '#313d3d',
    3: '#ffffff26',
    4: '#ffffff33',
    5: '#1e8a8a26',
  },
};

// Parse SCSS content to extract colors object
function parseScssColors(content: string): ColorPalette {
  const colors: Partial<ColorPalette> = {};
  
  // Extract common colors
  const commonMatch = content.match(/common:\s*\(([\s\S]*?)\)/);
  if (commonMatch) {
    const commonContent = commonMatch[1];
    const whiteMatch = commonContent.match(/white:\s*#([0-9a-fA-F]+)/);
    const blackMatch = commonContent.match(/black:\s*#([0-9a-fA-F]+)/);
    colors.common = {
      white: whiteMatch ? `#${whiteMatch[1]}` : '#ffffff',
      black: blackMatch ? `#${blackMatch[1]}` : '#000000',
    };
  }
  
  // Extract heading colors
  const headingMatch = content.match(/heading:\s*\(([\s\S]*?)\)/);
  if (headingMatch) {
    const headingContent = headingMatch[1];
    const primaryMatch = headingContent.match(/primary:\s*#([0-9a-fA-F]+)/);
    colors.heading = {
      primary: primaryMatch ? `#${primaryMatch[1]}` : '#0c1e21',
    };
  }
  
  // Extract text colors
  const textMatch = content.match(/text:\s*\(([\s\S]*?)\)/);
  if (textMatch) {
    const textContent = textMatch[1];
    const bodyMatch = textContent.match(/body:\s*#([0-9a-fA-F]+)/);
    const body2Match = textContent.match(/body-2:\s*#([0-9a-fA-F]+)/);
    const body3Match = textContent.match(/body-3:\s*#([0-9a-fA-F]+)/);
    const body4Match = textContent.match(/body-4:\s*#([0-9a-fA-F]+)/);
    const body5Match = textContent.match(/body-5:\s*#([0-9a-fA-F]+)/);
    colors.text = {
      body: bodyMatch ? `#${bodyMatch[1]}` : '#364e52',
      body2: body2Match ? `#${body2Match[1]}` : '#a9b8b8',
      body3: body3Match ? `#${body3Match[1]}` : '#67787a',
      body4: body4Match ? `#${body4Match[1]}` : '#18292c',
      body5: body5Match ? `#${body5Match[1]}` : '#ffffffcc',
    };
  }
  
  // Extract theme colors
  const themeMatch = content.match(/theme:\s*\(([\s\S]*?)\)/);
  if (themeMatch) {
    const themeContent = themeMatch[1];
    const primaryMatch = themeContent.match(/primary:\s*#([0-9a-fA-F]+)/);
    const bgMatch = themeContent.match(/bg:\s*#([0-9a-fA-F]+)/);
    const bg2Match = themeContent.match(/bg-2:\s*#([0-9a-fA-F]+)/);
    const bg3Match = themeContent.match(/bg-3:\s*#([0-9a-fA-F]+)/);
    const darkMatch = themeContent.match(/dark:\s*#([0-9a-fA-F]+)/);
    const dark2Match = themeContent.match(/dark-2:\s*#([0-9a-fA-F]+)/);
    const dark3Match = themeContent.match(/dark-3:\s*#([0-9a-fA-F]+)/);
    const dark4Match = themeContent.match(/dark-4:\s*#([0-9a-fA-F]+)/);
    const dark5Match = themeContent.match(/dark-5:\s*#([0-9a-fA-F]+)/);
    colors.theme = {
      primary: primaryMatch ? `#${primaryMatch[1]}` : '#1e8a8a',
      bg: bgMatch ? `#${bgMatch[1]}` : '#d8e5e5',
      bg2: bg2Match ? `#${bg2Match[1]}` : '#cee0e0',
      bg3: bg3Match ? `#${bg3Match[1]}` : '#202e30',
      dark: darkMatch ? `#${darkMatch[1]}` : '#0c1e21',
      dark2: dark2Match ? `#${dark2Match[1]}` : '#18292c',
      dark3: dark3Match ? `#${dark3Match[1]}` : '#364e52',
      dark4: dark4Match ? `#${dark4Match[1]}` : '#67787a',
      dark5: dark5Match ? `#${dark5Match[1]}` : '#676e7a',
    };
  }
  
  // Extract grey colors
  const greyMatch = content.match(/grey:\s*\(([\s\S]*?)\)/);
  if (greyMatch) {
    const greyContent = greyMatch[1];
    const grey1Match = greyContent.match(/1:\s*#([0-9a-fA-F]+)/);
    const grey2Match = greyContent.match(/2:\s*#([0-9a-fA-F]+)/);
    const grey3Match = greyContent.match(/3:\s*#([0-9a-fA-F]+)/);
    colors.grey = {
      1: grey1Match ? `#${grey1Match[1]}` : '#ecf0f0',
      2: grey2Match ? `#${grey2Match[1]}` : '#a9b8b8',
      3: grey3Match ? `#${grey3Match[1]}` : '#ffffff1a',
    };
  }
  
  // Extract border colors
  const borderMatch = content.match(/border:\s*\(([\s\S]*?)\)/);
  if (borderMatch) {
    const borderColor = borderMatch[1];
    const border1Match = borderColor.match(/1:\s*#([0-9a-fA-F]+)/);
    const border2Match = borderColor.match(/2:\s*#([0-9a-fA-F]+)/);
    const border3Match = borderColor.match(/3:\s*#([0-9a-fA-F]+)/);
    const border4Match = borderColor.match(/4:\s*#([0-9a-fA-F]+)/);
    const border5Match = borderColor.match(/5:\s*#([0-9a-fA-F]+)/);
    colors.border = {
      1: border1Match ? `#${border1Match[1]}` : '#c9d1d1',
      2: border2Match ? `#${border2Match[1]}` : '#313d3d',
      3: border3Match ? `#${border3Match[1]}` : '#ffffff26',
      4: border4Match ? `#${border4Match[1]}` : '#ffffff33',
      5: border5Match ? `#${border5Match[1]}` : '#1e8a8a26',
    };
  }
  
  return colors as ColorPalette;
}

// Generate SCSS content from color palette
function generateScssContent(colors: ColorPalette): string {
  const formatColor = (color: string) => color;

  return `$colors: (
  common: (
    white: ${formatColor(colors.common.white)},
    black: ${formatColor(colors.common.black)},
  ),
  heading: (
    primary: ${formatColor(colors.heading.primary)},
  ),
  text: (
    body: ${formatColor(colors.text.body)},
    body-2: ${formatColor(colors.text.body2)},
    body-3: ${formatColor(colors.text.body3)},
    body-4: ${formatColor(colors.text.body4)},
    body-5: ${formatColor(colors.text.body5)},
  ),
  theme: (
    primary: ${formatColor(colors.theme.primary)},
    bg: ${formatColor(colors.theme.bg)},
    bg-2: ${formatColor(colors.theme.bg2)},
    bg-3: ${formatColor(colors.theme.bg3)},
    dark: ${formatColor(colors.theme.dark)},
    dark-2: ${formatColor(colors.theme.dark2)},
    dark-3: ${formatColor(colors.theme.dark3)},
    dark-4: ${formatColor(colors.theme.dark4)},
    dark-5: ${formatColor(colors.theme.dark5)},
  ),
  grey: (
    1: ${formatColor(colors.grey[1])},
    2: ${formatColor(colors.grey[2])},
    3: ${formatColor(colors.grey[3])},
  ),
  border: (
    1: ${formatColor(colors.border[1])},
    2: ${formatColor(colors.border[2])},
    3: ${formatColor(colors.border[3])},
    4: ${formatColor(colors.border[4])},
    5: ${formatColor(colors.border[5])},
  ),
);`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    if (!existsSync(COLORS_FILE)) {
      return NextResponse.json(
        { success: false, error: 'Colors file not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const content = await readFile(COLORS_FILE, 'utf-8');
    
    // Parse the SCSS content to extract colors
    const colors = parseScssColors(content);
    
    return NextResponse.json(
      {
        success: true,
        data: { colors, content },
        message: 'Colors retrieved successfully',
      } as ApiResponse<{ colors: ColorPalette; content: string }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get colors error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to get colors' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { colors } = body;

    if (!colors) {
      return NextResponse.json(
        { success: false, error: 'Colors data is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate colors structure
    const requiredKeys = ['common', 'heading', 'text', 'theme', 'grey', 'border'];
    for (const key of requiredKeys) {
      if (!colors[key]) {
        return NextResponse.json(
          { success: false, error: `Missing color category: ${key}` } as ApiResponse<null>,
          { status: 400 }
        );
      }
    }

    // Generate SCSS content
    const scssContent = generateScssContent(colors as ColorPalette);

    // Write to file
    await writeFile(COLORS_FILE, scssContent, 'utf-8');

    return NextResponse.json(
      {
        success: true,
        data: { colors } as { colors: ColorPalette },
        message: 'Colors updated successfully in SCSS file',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update colors error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update colors' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
