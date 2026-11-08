"use client";

import { FormEvent, useEffect, useState } from "react";

import { createProject } from "../../api/projects";
import { getAllUsers, type User } from "../../api/users";
import styles from "./add_project_form.module.css";

type AddProjectFormState = {
	project_name: string;
	project_manager_id: string;
	project_description: string;
};

const initialFormState: AddProjectFormState = {
	project_name: "",
	project_manager_id: "",
	project_description: "",
};

type AddProjectFormProps = {
	onProjectAdded?: () => void;
};

export default function AddProjectForm({ onProjectAdded }: AddProjectFormProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [formData, setFormData] = useState<AddProjectFormState>(initialFormState);
	const [users, setUsers] = useState<User[]>([]);

	// Load users for the manager dropdown whenever the form is opened
	useEffect(() => {
		if (!isExpanded) return;
		const loadUsers = async () => {
			try {
				setUsers(await getAllUsers());
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to load users.";
				setError(message);
			}
		};
		void loadUsers();
	}, [isExpanded]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (!formData.project_name || !formData.project_manager_id || !formData.project_description) {
			setError("All fields are required.");
			return;
		}

		try {
			setIsSubmitting(true);
			await createProject({
				project_name: formData.project_name,
				project_manager_id: Number(formData.project_manager_id),
				project_description: formData.project_description,
			});
			onProjectAdded?.();

			setFormData(initialFormState);
			setSuccessMessage("Project added successfully.");
			setIsExpanded(false);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create project.";
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
				aria-controls="add-project-form"
			>
				{isExpanded ? "Hide Add Project Form" : "Add Project"}
			</button>

			{isExpanded && (
				<form id="add-project-form" className={styles.form} onSubmit={handleSubmit}>
					<label className={styles.label}>
						Project Name
						<input
							className={styles.input}
							type="text"
							value={formData.project_name}
							onChange={(event) =>
								setFormData((previous) => ({ ...previous, project_name: event.target.value }))
							}
						/>
					</label>

					<label className={styles.label}>
						Manager
						<select
							className={styles.input}
							value={formData.project_manager_id}
							onChange={(event) =>
								setFormData((previous) => ({ ...previous, project_manager_id: event.target.value }))
							}
						>
							<option value="">Select a manager</option>
							{users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.user_name}
								</option>
							))}
						</select>
					</label>

					<label className={styles.label}>
						Description
						<textarea
							className={styles.input}
							rows={3}
							value={formData.project_description}
							onChange={(event) =>
								setFormData((previous) => ({ ...previous, project_description: event.target.value }))
							}
						/>
					</label>

					<button className={styles.submitButton} type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save Project"}
					</button>
				</form>
			)}

			{error && <p className={styles.error}>{error}</p>}
			{successMessage && <p className={styles.success}>{successMessage}</p>}
		</section>
	);
}
