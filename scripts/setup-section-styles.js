/**
 * Creates section_styles + site_theme collections for dynamic website colors.
 *
 * Usage:
 *   node scripts/setup-section-styles.js
 *
 * Env:
 *   API_URL=http://localhost:3001  (Bexon proxies CMS on 3001)
 *   AUTH_TOKEN=...                 (superadmin session token if required)
 */

const http = require("http");
const https = require("https");

const API_BASE = process.env.API_URL || "http://localhost:3001";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";

const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[36m",
};

function makeRequest(method, path, data = null) {
	return new Promise((resolve, reject) => {
		const url = new URL(path, API_BASE);
		const client = url.protocol === "https:" ? https : http;

		const headers = { "Content-Type": "application/json" };
		if (AUTH_TOKEN) headers.Authorization = `Bearer ${AUTH_TOKEN}`;

		const options = {
			hostname: url.hostname,
			port: url.port,
			path: url.pathname + url.search,
			method,
			headers,
		};

		const req = client.request(options, (res) => {
			let responseData = "";
			res.on("data", (chunk) => {
				responseData += chunk;
			});
			res.on("end", () => {
				try {
					resolve({ status: res.statusCode, data: JSON.parse(responseData) });
				} catch {
					resolve({ status: res.statusCode, data: responseData });
				}
			});
		});

		req.on("error", reject);
		if (data) req.write(JSON.stringify(data));
		req.end();
	});
}

function log(message, type = "info") {
	const prefix = {
		info: `${colors.blue}i${colors.reset}`,
		success: `${colors.green}✓${colors.reset}`,
		error: `${colors.red}✗${colors.reset}`,
		warn: `${colors.yellow}!${colors.reset}`,
	}[type];
	console.log(`${prefix} ${message}`);
}

async function createCollection(def) {
	log(`Creating collection: ${def.name}...`);
	const response = await makeRequest("POST", "/api/collections", def);
	if (!response.data?.success) {
		throw new Error(
			`Failed to create ${def.name}: ${response.data?.error || response.status}`,
		);
	}
	log(`Collection ${def.name} ready (${response.data.data.id})`, "success");
	return response.data.data.id;
}

async function createField(collectionId, field) {
	const response = await makeRequest("POST", "/api/fields", {
		collection_id: collectionId,
		...field,
	});
	if (!response.data?.success) {
		log(`Field skipped/failed: ${field.name} — ${response.data?.error}`, "warn");
		return;
	}
	log(`Field: ${field.display_name}`, "success");
}

async function createRecord(collectionName, record) {
	const response = await makeRequest("POST", `/api/data/${collectionName}`, record);
	if (!response.data?.success) {
		log(`Record skipped: ${collectionName} — ${response.data?.error}`, "warn");
		return null;
	}
	return response.data.data;
}

async function setupSiteTheme() {
	const collectionId = await createCollection({
		name: "site_theme",
		display_name: "Site Theme",
		description: "Global brand colors (CSS variables on :root)",
		icon: "palette",
		color: "#1e8a8a",
	});

	const fields = [
		{ name: "key", display_name: "Theme Key", field_type: "Text", is_required: true, is_unique: true },
		{ name: "primary_color", display_name: "Primary Color", field_type: "Color" },
		{ name: "theme_bg", display_name: "Theme Background", field_type: "Color" },
		{ name: "heading_color", display_name: "Heading Color", field_type: "Color" },
		{ name: "body_text_color", display_name: "Body Text Color", field_type: "Color" },
		{ name: "dark_color", display_name: "Dark Accent", field_type: "Color" },
	];

	for (const field of fields) {
		await createField(collectionId, field);
	}

	await createRecord("site_theme", {
		key: "default",
		primary_color: "#1e8a8a",
		theme_bg: "#d8e5e5",
		heading_color: "#0c1e21",
		body_text_color: "#364e52",
		dark_color: "#0c1e21",
	});

	return collectionId;
}

async function setupSectionStyles() {
	const collectionId = await createCollection({
		name: "section_styles",
		display_name: "Section Styles",
		description: "Per-section background and text colors for the marketing site",
		icon: "layout",
		color: "#3B82F6",
	});

	const fields = [
		{
			name: "section_id",
			display_name: "Section ID",
			field_type: "Text",
			is_required: true,
			description: "Matches data-cms-section on the frontend (e.g. hero, features, cta)",
		},
		{
			name: "page_slug",
			display_name: "Page Slug",
			field_type: "Text",
			description: "Optional: home, about-us, contact. Leave empty for all pages.",
		},
		{
			name: "background_color",
			display_name: "Background Color",
			field_type: "Color",
			description: "Hex color (e.g. #ffffff)",
		},
		{
			name: "text_color",
			display_name: "Text Color",
			field_type: "Color",
			description: "Body text color for the section",
		},
		{
			name: "heading_color",
			display_name: "Heading Color",
			field_type: "Color",
			description: "Headings inside the section",
		},
		{
			name: "primary_color",
			display_name: "Section Primary",
			field_type: "Color",
			description: "Buttons/links accent within this section",
		},
		{
			name: "hover_background_color",
			display_name: "Hover Background",
			field_type: "Color",
			description: "Card/box background on hover (e.g. feature cards)",
		},
		{
			name: "hover_text_color",
			display_name: "Hover Text",
			field_type: "Color",
			description: "Title, description, icon color on hover",
		},
		{
			name: "is_active",
			display_name: "Active",
			field_type: "Boolean",
		},
	];

	for (const field of fields) {
		await createField(collectionId, field);
	}

	const homeSections = [
		{ section_id: "hero", background_color: "#0c1e21", text_color: "#ffffff", heading_color: "#ffffff" },
		{
			section_id: "features",
			background_color: "#ffffff",
			text_color: "#364e52",
			heading_color: "#0c1e21",
			primary_color: "#1e8a8a",
			hover_background_color: "#1e8a8a",
			hover_text_color: "#ffffff",
		},
		{ section_id: "brands", background_color: "#ecf0f0", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "about", background_color: "#ffffff", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "services", background_color: "#d8e5e5", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "portfolios", background_color: "#ffffff", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "funfact", background_color: "#1e8a8a", text_color: "#ffffff", heading_color: "#ffffff", primary_color: "#ffffff" },
		{ section_id: "testimonials", background_color: "#ffffff", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "faq", background_color: "#ecf0f0", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "contact", background_color: "#ffffff", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "blogs", background_color: "#ffffff", text_color: "#364e52", heading_color: "#0c1e21" },
		{ section_id: "cta", background_color: "#0c1e21", text_color: "#ffffff", heading_color: "#ffffff", primary_color: "#1e8a8a" },
	];

	for (const row of homeSections) {
		await createRecord("section_styles", {
			page_slug: "home",
			is_active: true,
			...row,
		});
	}

	return collectionId;
}

async function setup() {
	try {
		console.log(`\n${colors.blue}Section styles CMS setup${colors.reset}\n`);
		await setupSiteTheme();
		await setupSectionStyles();
		console.log(`
${colors.green}Setup complete.${colors.reset}

Manage colors in CMS admin, then read via:
  GET ${API_BASE}/api/data/site_theme
  GET ${API_BASE}/api/data/section_styles

Frontend (Bexon) uses section_id + page_slug to apply styles.
`);
	} catch (error) {
		log(error.message, "error");
		process.exit(1);
	}
}

setup();
