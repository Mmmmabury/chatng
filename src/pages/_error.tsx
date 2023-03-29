import React from "react";
import { NextPageContext } from "next";

interface ErrorProps {
    statusCode: number | null;
}

class Error extends React.Component<ErrorProps> {
    static getInitialProps({ res, err }: NextPageContext): ErrorProps {
        const statusCode = res ? res.statusCode : err ? err.statusCode! : null;
        return { statusCode };
    }

    render() {
        return (
            <div>
                {this.props.statusCode === 404 ? (
                    <h1>This page could not be found.</h1>
                ) : (
                    <h1>An error occurred.</h1>
                )}
            </div>
        );
    }
}

export default Error;
