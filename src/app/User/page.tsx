"use client"


import type {FieldConfig} from "@/app/components/form-builder/type"
import {toast} from "sonner"
import z from "zod"
import {FormBuilder} from "@/app/components/form-builder/form-builder";

// 1. Define Schema
const userSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    age: z.number().min(18, "Must be at least 18 years old").optional(),
    newsletter: z.boolean().optional(),
    notes: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

// 2. Define Fields with responsive colSpan and mode-based behavior
const userFields: FieldConfig<UserFormValues>[] = [
    {
        name: "id",
        label: "User ID",
        type: "text",
        readOnly: (values, mode) => mode === "update" || mode === "delete", // Read-only in update/delete mode
        hidden: (values, mode) => mode === "create", // Hidden in create mode
        colSpan: { mobile: 1, tablet: 2, desktop: 3 }, // Takes full width on desktop
    },
    {
        name: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Enter your first name",
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    },
    {
        name: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Enter your last name",
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    },
    {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
        readOnly: (values, mode) => mode === "update", // Email is non-editable during update
        colSpan: { mobile: 1, tablet: 2, desktop: 2 }, // Takes 2 columns on tablet and desktop
    },
    {
        name: "age",
        label: "Age",
        type: "number",
        placeholder: "Enter your age",
        hidden: (values, mode) => !values.newsletter && mode !== "delete", // Hidden if newsletter is not checked, unless in delete mode
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    },
    {
        name: "newsletter",
        label: "Subscribe to Newsletter",
        type: "checkbox",
        colSpan: { mobile: 1, tablet: 2, desktop: 3 }, // Takes full width on desktop
    },
    {
        name: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Add any notes here...",
        colSpan: { mobile: 1, tablet: 2, desktop: 3 }, // Takes full width on desktop
    },
]

export default function HomePage() {
    // Handlers for different CRUD operations
    const handleCreate = (data: UserFormValues) => {
        console.log("Create data:", data)
        toast.success("User created successfully!")
    }

    const handleUpdate = (data: UserFormValues) => {
        console.log("Update data:", data)
        toast.success("User updated successfully!")
    }

    const handleDelete = (data: UserFormValues) => {
        console.log("Delete data:", data)
        toast.success("User deleted successfully!")
    }

    // Example existing user data for update/delete modes
    const existingUser = {
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        age: 30,
        newsletter: true,
        notes: "This is an existing user.",
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50 space-y-8">
            {/* Create Form Example */}
            <FormBuilder
                schema={userSchema}
                fields={userFields}
                onSubmit={handleCreate}
                title="Create New User"
                description="Fill in the details to create a new user account."
                mode="create"
                defaultValues={{ newsletter: false }} // Default for create mode
            />

            {/* Update Form Example */}
            <FormBuilder
                schema={userSchema}
                fields={userFields}
                onSubmit={handleUpdate}
                title="Update User Profile"
                description="Edit user details. User ID and Email are non-editable."
                mode="update"
                defaultValues={existingUser}
            />

            {/* Delete Form Example */}
            <FormBuilder
                schema={userSchema}
                fields={userFields}
                onSubmit={handleDelete} // onSubmit is used for the form submission
                onDelete={handleDelete} // onDelete is specifically for the delete action
                title="Delete User"
                description="Review user details before confirming deletion. All fields are read-only."
                mode="delete"
                defaultValues={existingUser}
            />
        </main>
    )
}
