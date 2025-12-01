"use client";

import { Tooltip, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

// Regular function for use in format functions (not a hook)
export function spliceLongText(text: string, count: number) {
    if (!text) return <span style={{ fontSize: "12px" }}>N/A</span>;
    
    const isLongText = text.length > count;
    const slicedText = isLongText ? text.slice(0, count) : text;

    return (
        <>
            {isLongText ? (
                <Tooltip placement="top" title={text}>
                    <Typography variant="caption" sx={{ display: "flex", flexDirection: "row" }}>
                        <Typography sx={{ fontSize: '12px' }}>{slicedText} ...  </Typography>
                        <InfoOutlined sx={{ cursor: "pointer", width: 12 }} />
                    </Typography>
                </Tooltip>
            ) : (
                <span style={{ fontSize: "12px" }}>{slicedText}</span>
            )}
        </>
    );
}

// Hook version for use in components
export function useSpliceLongText(text: string, count: number) {
    const isLongText = text && text.length > count;
    const slicedText = isLongText ? text.slice(0, count) : text;

    return (
        <>
            {isLongText ? (
                <Tooltip placement="top" title={text}>
                    <Typography variant="caption" sx={{ display: "flex", flexDirection: "row" }}>
                        <Typography sx={{ fontSize: '12px' }}>{slicedText} ...  </Typography>
                        <InfoOutlined sx={{ cursor: "pointer", width: 12 }} />
                    </Typography>
                </Tooltip>
            ) : (
                <span style={{ fontSize: "12px" }}>{slicedText}</span>
            )}
        </>
    );
}