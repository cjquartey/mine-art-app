import { SectionHeader } from "../../components/SectionHeader";

export function InstructionSection() {
    return (
        <>
            <SectionHeader text={"Mine Art is super simple to use!"} />
            <div className="grid grid-cols-4 gap-4 mt-10 mb-20">
                <Instruction 
                    title={"Upload Image"}
                    body={"Upload your desired picture"}
                    position={1}
                    imageSource={"https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"}
                    alternateText={"Shoes"}
                />

                <Instruction 
                    title={"Select Style"}
                    body={"Choose from our 3 line art styles and click generate image"}
                    position={2}
                    imageSource={"https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"}
                    alternateText={"Shoes"}
                />

                <Instruction 
                    title={"Edit Drawing"}
                    body={"Our drawing editor gives you complete control over the generated drawing. Edit as you please!"}
                    position={3}
                    imageSource={"https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"}
                    alternateText={"Shoes"}
                />

                <Instruction 
                    title={"Download"}
                    body={"Save a high quality SVG image"}
                    position={4}
                    imageSource={"https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"}
                    alternateText={"Shoes"}
                />
            </div>
        </>
    );
};

function Instruction({title, body, position, imageSource, alternateText}){
    return(
        <div className="card bg-base-100 w-96 shadow-sm">
            <div className="card-body">
                <h2 className="card-title text-2xl"><span className="badge badge-secondary text-xl">{position}</span>{title}</h2>
                <p className="text-base">{body}</p>
            </div>
            <figure>
                <img
                src={imageSource}
                alt={alternateText} />
            </figure>
        </div>
    );
};