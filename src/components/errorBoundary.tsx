import React, { useEffect, useState } from "react";

type ErrorBoundaryProps = {
    children: React.ReactNode;
};

function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Update state when an error is thrown
        const handleErrors = () => setHasError(true);
        window.addEventListener("error", handleErrors);
        return () => window.removeEventListener("error", handleErrors);
    }, []);

    // Render error message if there's an error
    if (hasError) {
        return (
            <div>
                <h2>Oops, there is an error!</h2>
                <button type="button" onClick={() => setHasError(false)}>
                    Try again?
                </button>
            </div>
        );
    }

    // Return children components in case of no error
    return <>{children}</>;
}

export default ErrorBoundary;
