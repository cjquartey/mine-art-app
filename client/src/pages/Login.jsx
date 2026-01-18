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
        <div className="hero bg-base-200 h-[calc(100vh-64px)]">
            <div className="hero-content flex-col lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <h1 className="text-5xl font-bold mb-10">Welcome back!</h1>
                    <ul className="list bg-base-100 rounded-box shadow-md">
                        <li className="list-row text-xl">
                            Collaborate with other designers
                        </li>
                        <li className="list-row text-xl">
                            Save your projects
                        </li>
                    </ul>
                </div>
                
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <div className="card-body">
                        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
                                <legend className="fieldset-legend">Login</legend>

                                <label className="label">Email</label>
                                <input {...register("email")} type="email" className="input" placeholder="Email address" />
                                {errors.email && (<ErrorMessage message={errors.email.message} />)}

                                <label className="label">Password</label>
                                <input {...register("password")} type={visiblePassword ? "text" : "password"} className="input" placeholder="Password" />
                                <button type="button" className="btn btn-warning" onClick={togglePasswordVisibility}>
                                    {visiblePassword ? "Hide" : "Show"}
                                </button>
                                {errors.password && (<ErrorMessage message={errors.password.message} />)}

                                <button className="btn btn-lg btn-neutral mt-4" disabled={isSubmitting} type="submit">
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </button>

                                {errors.root && (<ErrorMessage message={errors.root.message} />)}
                            </fieldset>
                        </form>

                        <div>Don't have an account? 
                            <Link className="font-bold" to="/register"> Sign up here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};