import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {ErrorMessage} from '../components/ErrorMessage';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useAuthContext} from '../hooks/useAuthContext';

// Zod schema to validate registration fields
// This schema only has basic rules for instant feedback 
// while the backend handles finer details and logic
const RegistrationSchema = z.object({
    firstName: z.string().nonempty('First name is required'),
    lastName: z.string().nonempty('Last name is required'),
    username: z.string().nonempty('Username is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().nonempty('Password is required')
});

export function RegisterPage() {
    // Form configuration with field registration, submission, and error management
    const {
        register, 
        handleSubmit,
        setError,
        formState: {errors, isSubmitting},
    } = useForm({resolver: zodResolver(RegistrationSchema)});

    // Handles redirection
    const navigate = useNavigate();

    // Register function from the useAuthContext custom hook
    const registerRequest = useAuthContext().register;

    async function onSubmit(data) {
        try{
            await registerRequest(data);
            // Redirect upon successful response
            navigate('/dashboard', {replace: true});
        } catch(error) {         
            // Registration failure could either result from validation or conflict errors

            // Handle middleware validation errors
            const middlewareErrors = error.response?.data?.errors;
            if(middlewareErrors) {
                // Categorise middleware validation errors by their input field for proper rendering
                const passwordErrors = [];

                middlewareErrors.forEach((error) => {
                    // The first word of each backend error message contains the violated field name
                    const errorType = error.split(' ')[0];
                    if (errorType==='Username') {
                        // Only one username error expected so it is set immediately
                        setError("username", {message: error});
                    }
                    else if (errorType==='Password') {
                        // Password errors are stored in an array to handle multiple validation errors
                        passwordErrors.push(error);
                    }
                });

                // Multiple password errors are set with new line separators
                // for clearer rendering by the ErrorMessage component
                if (passwordErrors.length > 0){
                    setError("password", {message: passwordErrors.join('\n')});
                };
            };            

            // Non-validation errors are handled at the root
            setError("root", {message: error.response?.data?.message});
        }
    }

    // State and function to manage password visibility
    const [visiblePassword, setShowPassword] = useState(false);
    function togglePasswordVisibility(){
        visiblePassword ? setShowPassword(false) : setShowPassword(true);
    }

    return(
        <>
            <h1>Register Page</h1>

            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                <input {...register("firstName")} placeholder="First Name" />
                {errors.firstName && <ErrorMessage message={errors.firstName.message} />}

                <input {...register("lastName")} placeholder="Last Name" />
                {errors.lastName && <ErrorMessage message={errors.lastName.message} />}

                <input {...register("username")} placeholder="Username" />
                {errors.username && <ErrorMessage message={errors.username.message} />}

                <input {...register("email")} placeholder="Email address" />
                {errors.email && <ErrorMessage message={errors.email.message} />}

                <input {...register("password")} type={visiblePassword ? "text" : "password"} placeholder="Password" />
                <button type="button" onClick={togglePasswordVisibility}>
                    {visiblePassword ? "Hide" : "Show"}
                </button>
                {errors.password && <ErrorMessage message={errors.password.message} />}

                <button type="submit">
                    {isSubmitting ? "Processing..." : "Sign-up"}
                </button>

                {errors.root && <ErrorMessage message={errors.root.message} />}
            </form>

            <Link to="/login">Login</Link>
        </>
    );
};