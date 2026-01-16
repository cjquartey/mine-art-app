import {useState} from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {ErrorMessage} from '../components/ErrorMessage';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useAuthContext} from '../hooks/useAuthContext';

// Zod schema to validate login fields
const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().nonempty('Password is required')
});

export function LoginPage() {
    // Form configuration with field registration, submission, and error management
    const {
        register, 
        handleSubmit, 
        setError,
        formState: {errors, isSubmitting}
    } = useForm({resolver: zodResolver(LoginSchema)});

    // Handles redirection
    const navigate = useNavigate();

    // Redirect back to the page users were bounced from or straight to their dashboard page
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    // Login function from the useAuthContext hook
    const loginRequest = useAuthContext().login;

    async function onSubmit(data){
        try {
            await loginRequest(data.email, data.password);
            // Redirect upon successful response
            navigate(from, {replace:true});
        } catch(error) {
            // Zod validation matches middleware exactly;
            // therefore backend errors only originate at from the authController
            // and are handled at the root
            setError("root", {message: error.response?.data?.message});
        }
    };

    // State and function to manage password visibility
    const [visiblePassword, setShowPassword] = useState(false);
    function togglePasswordVisibility(){
        visiblePassword ? setShowPassword(false) : setShowPassword(true);
    }

    return(
        <>
            <h1>Login Page</h1>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                <input {...register("email")} type="text" placeholder="Email address" />
                {errors.email && (<ErrorMessage message={errors.email.message} />)}

                <input {...register("password")} type={visiblePassword ? "text" : "password"} placeholder="Password" />
                <button type="button" onClick={togglePasswordVisibility}>
                    {visiblePassword ? "Hide" : "Show"}
                </button>
                {errors.password && (<ErrorMessage message={errors.password.message} />)}

                <button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                {errors.root && (<ErrorMessage message={errors.root.message} />)}
            </form>

            <Link to="/register">Register</Link>
        </>
    );
};