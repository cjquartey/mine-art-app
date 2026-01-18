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
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <h1 className="text-5xl font-bold mb-10">Create an account</h1>
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
                                <legend className="fieldset-legend">Sign Up</legend>

                                <label className="label">First Name</label>
                                <input {...register("firstName")} type="text" className="input" placeholder="First Name" />
                                {errors.firstName && <ErrorMessage message={errors.firstName.message} />}

                                <label className="label">Last Name</label>
                                <input {...register("lastName")} type="text" className="input" placeholder="Last Name" />
                                {errors.lastName && <ErrorMessage message={errors.lastName.message} />}

                                <label className="label">Username</label>
                                <input {...register("username")} type="text" className="input" placeholder="Username" />
                                {errors.username && <ErrorMessage message={errors.username.message} />}

                                <label className="label">Email</label>
                                <input {...register("email")} type="email" className="input" placeholder="Email address" />
                                {errors.email && <ErrorMessage message={errors.email.message} />}

                                <label className="label">Password</label>
                                <input {...register("password")} className="input" type={visiblePassword ? "text" : "password"} placeholder="Password" />
                                <button type="button" className="btn btn-warning" onClick={togglePasswordVisibility}>
                                    {visiblePassword ? "Hide" : "Show"}
                                </button>
                                {errors.password && <ErrorMessage message={errors.password.message} />}

                                <button className="btn btn-lg btn-neutral mt-4" type="submit">
                                    {isSubmitting ? "Processing..." : "Sign up"}
                                </button>

                                {errors.root && <ErrorMessage message={errors.root.message} />}
                            </fieldset>
                        </form>

                        <div>Already have an account? 
                            <Link className="font-bold" to="/login"> Login here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};