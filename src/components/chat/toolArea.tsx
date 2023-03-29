import { log } from "@/helper/logger";
import React, { useState, useRef, useEffect } from "react";

const ToolArea: React.FC<{
    showRg: boolean;
    msg: string;
    showStop: boolean;
    handleStop: Function;
}> = (props) => {
    const [showRg, setShowRg] = useState<boolean>(props.showRg);
    const [showStop, setShowStop] = useState<boolean>(props.showStop);
    const [msg, setMsg] = useState<string>(props.msg);

    useEffect(() => {
        setShowRg(props.showRg);
        setShowStop(props.showStop);
    }, [props.showRg, props.showStop]);

    const handleClick = () => {
        if (showStop) {
            props.handleStop();
        }
    };

    return (
        <>
            <div className="flex items-center justify-center">
                {(showRg || showStop) && (
                    <>
                        <div>{msg}</div>
                        <button
                            onClick={handleClick}
                            className="mb-1 rounded border border-black/10 py-2 px-4 hover:bg-gray-100"
                        >
                            {showRg ? "重新生成" : "停止"}
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

export default ToolArea;
