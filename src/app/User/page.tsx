"use client";

import {FormBuilder} from "@/app/components/form-builder/Form";
import z from "zod";
import {FieldConfig} from "@/app/components/form-builder/type";
import {toast} from "sonner";


const userFields: FieldConfig<UserFormValues>[] = [
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
        colSpan: { mobile: 1, tablet: 2, desktop: 2 }, // Takes 2 columns on tablet and desktop
    },
    {
        name: "age",
        label: "Age",
        type: "number",
        placeholder: "Enter your age",
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
        hidden: (values) => !values.newsletter, // Hidden if newsletter is not checked
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    },
    {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "Confirm your password",
        colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    },
    {
        name: "newsletter",
        label: "Subscribe to Newsletter",
        type: "text", // This would typically be a checkbox, but for demonstration, using text
        placeholder: "Check for newsletter",
        colSpan: { mobile: 1, tablet: 2, desktop: 3 }, // Takes full width on desktop
    },
]

const userSchema = z
    .object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Invalid email address"),
        age: z.number().min(18, "Must be at least 18 years old").optional(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
        newsletter: z.boolean().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

type UserFormValues = z.infer<typeof userSchema>

export default function UserForm() {
    const handleSubmit = (data: UserFormValues) => {
        console.log("Form submitted:", data)
        toast.success("Form submitted successfully!")
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50">
            <FormBuilder
                schema={userSchema}
                fields={userFields}
                onSubmit={handleSubmit}
                submitLabel="Register"
                title="User Registration"
                description="Fill in your details to create an account."
                defaultValues={{
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    newsletter: false,
                }}
            />
        </main>
    )
}