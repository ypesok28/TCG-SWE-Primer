"use client";

import { FormEvent, useEffect, useState } from "react";

import { createAssociate } from "../../api/associates";
import { getAllProjects, type Project } from "../../api/projects";
import { getAllUsers, type User } from "../../api/users";
import styles from "./assign_user_to_project_form.module.css";

type AssignFormState = {
	project_id: string;
	associate_id: string;
};

const initialFormState: AssignFormState = {
	project_id: "",
	associate_id: "",
};

type AssignUserToProjectFormProps = {
	onAssignmentAdded?: () => void;
};

export default function AssignUserToProjectForm({ onAssignmentAdded }: AssignUserToProjectFormProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [formData, setFormData] = useState<AssignFormState>(initialFormState);
	const [projects, setProjects] = useState<Project[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	// Load projects and users for the dropdowns whenever the form is opened
	useEffect(() => {
		if (!isExpanded) return;
		const loadOptions = async () => {
			try {
				const [allProjects, allUsers] = await Promise.all([getAllProjects(), getAllUsers()]);
				setProjects(allProjects);
				setUsers(allUsers);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to load projects and users.";
				setError(message);
			}
		};
		void loadOptions();
	}, [isExpanded]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (!formData.project_id || !formData.associate_id) {
			setError("Select both a project and a user.");
			return;
		}

		try {
			setIsSubmitting(true);
			await createAssociate({
				project_id: Number(formData.project_id),
				associate_id: Number(formData.associate_id),
			});
			onAssignmentAdded?.();

			setFormData(initialFormState);
			setSuccessMessage("User assigned successfully.");
			setIsExpanded(false);
		} catch (err) {
			// The backend rejects duplicates, so this also covers "already assigned"
			const message = err instanceof Error ? err.message : "Failed to assign user.";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className={styles.container}>
			<button
				className={styles.toggleButton}
				type="button"
				onClick={() => {
					setIsExpanded((previous) => !previous);
					setError(null);
					setSuccessMessage(null);
				}}
				aria-expanded={isExpanded}
				aria-controls="assign-user-form"
			>
				{isExpanded ? "Hide Assign User Form" : "Assign User to Project"}
			</button>

			{isExpanded && (
				<form id="assign-user-form" className={styles.form} onSubmit={handleSubmit}>
					<label className={styles.label}>
						Project
						<select
							className={styles.input}
							value={formData.project_id}
							onChange={(event) =>
								setFormData((previous) => ({ ...previous, project_id: event.target.value }))
							}
						>
							<option value="">Select a project</option>
							{projects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.project_name}
								</option>
							))}
						</select>
					</label>

					<label className={styles.label}>
						User
						<select
							className={styles.input}
							value={formData.associate_id}
							onChange={(event) =>
								setFormData((previous) => ({ ...previous, associate_id: event.target.value }))
							}
						>
							<option value="">Select a user</option>
							{users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.user_name}
								</option>
							))}
						</select>
					</label>

					<button className={styles.submitButton} type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Assigning..." : "Assign User"}
					</button>
				</form>
			)}

			{error && <p className={styles.error}>{error}</p>}
			{successMessage && <p className={styles.success}>{successMessage}</p>}
		</section>
	);
}
