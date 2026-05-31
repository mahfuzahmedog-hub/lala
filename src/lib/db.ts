import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "projects.json");

export async function getProjects() {
    try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export async function saveProjects(projects: any) {
    const dir = path.dirname(DB_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
}
