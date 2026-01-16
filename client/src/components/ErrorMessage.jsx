export function ErrorMessage({message}) {
    // This component should only display with a message
    if (!message) return null;

    // Split messages by newlines to render each error on a separate line
    const messages = message.split('\n');

    return(
        <div className="bg-red-200 border-red-400 border border-l-8 text-red-800 px-4 py-3 rounded">
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