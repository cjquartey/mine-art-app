export function ErrorMessage({message}) {
    // This component should only display with a message
    if (!message) return null;

    // Split messages by newlines to render each error on a separate line
    const messages = message.split('\n');

    return(
        <div role="alert" className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {/*Render messages in a list when there are more than one*/}
            {messages.length > 1 ? (
                <ul>
                    {messages.map((msg, idx) => 
                        <li key={idx}>{msg}</li>
                    )}
                </ul> 
            ) : (
                message
            )}
        </div>
    );
};