import {Link} from 'react-router-dom';

export function HeroSection() {
    return(
        <div className="hero h-[calc(100vh-64px)] relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <figure className="diff h-full w-full border-none" tabIndex={0}>
                    <div className="diff-item-1" role="img" tabIndex={0}>
                        <img alt="Image preview" src="/gulf_stream_image.jpg" className="object-cover w-full h-full" />
                    </div>
                    <div className="diff-item-2" role="img">
                        <img
                        alt="Line art preview"
                        src="/gulf_stream_sketch.png" className="object-cover w-full h-full" />
                    </div>
                    <div className="diff-resizer z-30"></div>
                </figure>
            </div>
            <div className="hero-overlay bg-opacity-40 z-10 pointer-events-none"></div>
            <div className="hero-content text-neutral-content text-center z-20 pointer-events-none">
                <div className="max-w-md">
                <h1 className="mb-5 text-5xl font-bold">Welcome to Mine Art</h1>
                <p className="mb-5">
                    Transform any image to a customisable line-art drawing in seconds!
                </p>
                <Link to="/upload" className="pointer-events-auto"><button className="btn btn-accent btn-wide btn-lg">Get Started</button></Link>
                {/*Redirect straight to the image upload page - should work even when user isn't logged in*/}
                </div>
            </div>
        </div>
    )
}