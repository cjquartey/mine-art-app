import { SectionHeader } from "./SectionHeader";
import { EditIcon, TeamIcon, QualityIcon } from "../../icons/";

export function ValueProposition() {
    return (
        <div className="mt-20 mb-20">
            <SectionHeader text={"Why choose Mine Art?"} />
            <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
                <SellingPoint 
                    title={"Editing"} 
                    body={"Our intuitive editor gives you complete creative control over every generated drawing by allowing you to edit even the individual strokes"}
                    position={1}
                    icon={<EditIcon />}
                />

                <SellingPoint 
                    title={"Live Collaboration"} 
                    body={"Mine Art allows you to share and edit the same project with other designers for real-time colloboration!"} 
                    position={2}
                    icon={<TeamIcon />}
                />

                <SellingPoint 
                    title={"SVG output"} 
                    body={"Export your artwork as scalable vector graphics that maintain sharp quality at all sizes - perfect for printing or further design"} 
                    position={3}
                    icon={<QualityIcon />}
                />
            </ul>
        </div>
    )
}

function SellingPoint({title, body, position, icon}) {
    return(
        <li>
            <div className="timeline-middle">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                >
                    <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                    />
                </svg>
            </div>
            <div className={`${position%2===0 ? 'timeline-end' : 'timeline-start md:text-end'} mb-10`}>
                <div className="flex justify-center mb-5">{icon}</div>
                <div className="text-4xl font-black flex justify-center mb-5">{title}</div>
                <div className="text-xl">{body}</div>
            </div>
            <hr />
        </li>
    )
}