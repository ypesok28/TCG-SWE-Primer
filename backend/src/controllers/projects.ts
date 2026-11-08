import { Request, Response } from "express";
import { supabase } from "../app";

// Copied from associates.ts — returns true if a user with this ID exists
const checkUserExists = async (userId: number) => {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (error) {
        console.error("Error checking if user exists:", error);
        return false;
    }
    return !!data;
};

// GET /projects/:id - Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
    if (error) {
        console.error("Error fetching project by ID:", error);
        return res.status(500).json({ error: "Failed to fetch project" });
    }
    return res.json(data);
};

// GET /projects/all - Get all projects
export const getAllProjects = async (_req: Request, res: Response) => {
    const { data, error } = await supabase
        .from("projects")
        .select("*");
    if (error) {
        console.error("Error fetching all projects:", error);
        return res.status(500).json({ error: "Failed to fetch projects" });
    }
    return res.json(data);
};

// POST /projects - Create a new project
export const createProject = async (req: Request, res: Response) => {
    const { project_name, project_manager_id, project_description } = req.body;

    // The manager must be an existing user
    const managerExists = await checkUserExists(project_manager_id);
    if (!managerExists) {
        return res.status(400).json({ error: "Invalid project manager ID" });
    }

    const { data, error } = await supabase
        .from("projects")
        .insert({ project_name, project_manager_id, project_description })
        .select("*")
        .single();
    if (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
    }
    return res.status(201).json(data);
};

// PUT /projects/:id - Update a project by ID
export const updateProjectById = async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const { project_name, project_manager_id, project_description } = req.body;

    // Only check the manager if a new one was sent
    if (project_manager_id !== undefined) {
        const managerExists = await checkUserExists(project_manager_id);
        if (!managerExists) {
            return res.status(400).json({ error: "Invalid project manager ID" });
        }
    }

    // Only include the fields that were actually sent
    const projectData = {
        ...(project_name !== undefined && { project_name }),
        ...(project_manager_id !== undefined && { project_manager_id }),
        ...(project_description !== undefined && { project_description }),
    };

    const { data, error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", projectId)
        .select("*")
        .single();
    if (error) {
        console.error("Error updating project by ID:", error);
        return res.status(500).json({ error: "Failed to update project" });
    }
    return res.json(data);
};

// DELETE /projects/:id - Delete a project by ID
export const deleteProjectById = async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const { data, error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .select("*")
        .single();
    if (error) {
        console.error("Error deleting project by ID:", error);
        return res.status(500).json({ error: "Failed to delete project" });
    }
    return res.json(data);
};
