import { NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/lib/db";

export async function GET() {
    const projects = await getProjects();
    return NextResponse.json(projects);
}

export async function POST(req: Request) {
    const { id, project } = await req.json();
    const projects = await getProjects();
    projects[id] = project;
    await saveProjects(projects);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const { id } = await req.json();
    const projects = await getProjects();
    delete projects[id];
    await saveProjects(projects);
    return NextResponse.json({ success: true });
}
