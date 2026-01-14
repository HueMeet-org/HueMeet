"use client";
import { checkUserNameExists, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { toast } from "sonner";


export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [isUserNameTaken, setIsUserNameTaken] = useState(false);
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkLoginStatus = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (user) {
                toast.success('Already signed in!')
                router.push('/')
            }
        }

        checkLoginStatus();
    }, []);

    useEffect(() => {
        const checkUserName = async () => {
            if (userName) {
                const exists = await checkUserNameExists(userName);
                if (exists) {
                    setIsUserNameTaken(true);
                    toast.error('Username is already taken');
                } else {
                    setIsUserNameTaken(false);
                }
            }
        };
        checkUserName();
    }, [userName]);

    useEffect(() => {
        if (confirmPassword && password !== confirmPassword) {
            setPasswordMatch(false);
        } else {
            setPasswordMatch(true);
        }
    }, [password, confirmPassword]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: name,
                        username: userName
                    }
                },
            })

            if (data.user?.confirmed_at) {
                toast.success('Email confirmed! You can now log in.')
                router.push('/auth/login')
            }

            if (error) {
                toast.error(`Error: ${error.message}`)
                console.log('Sign-up error:', error)
            } else {
                toast.success('Check your email for the verification link!')
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(`Error: ${error.message}`);
            console.log('Google sign-up error:', error);
        }

        setLoading(false);
    }

    const handleGithubSignUp = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(`Error: ${error.message}`);
            console.log('Github sign-up error:', error);
        }

        setLoading(false);
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>
                        Sign up with your Google or Github account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp}>
                        <FieldGroup>
                            <Field>
                                <Button variant="outline" type="button" className="cursor-pointer" onClick={handleGithubSignUp}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-github" viewBox="0 0 16 16">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                    </svg>
                                    Sign up with Github
                                </Button>
                                <Button variant="outline" type="button" className="cursor-pointer" onClick={handleGoogleSignUp}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Sign up with Google
                                </Button>
                            </Field>
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Or continue with
                            </FieldSeparator>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input id="name" type="text" placeholder="John Doe" onChange={(e) => setName(e.target.value)} required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="username">UserName</FieldLabel>
                                <Input id="username" type="text" placeholder="JohnDoe" onChange={(e) => setUserName(e.target.value)} className={isUserNameTaken ? "border-red-500" : ""} required />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                <Field className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input id="password" type="password" onChange={(e) => setPassword(e.target.value)} required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirm-password">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input id="confirm-password" type="password" onChange={(e) => setConfirmPassword(e.target.value)} className={passwordMatch ? "" : "border-red-500"} required />
                                    </Field>
                                </Field>
                                <FieldDescription>
                                    Must be at least 8 characters long.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <Button type="submit" className="cursor-pointer" disabled={loading || isUserNameTaken || !passwordMatch}>Create Account</Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/login">Sign in</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
