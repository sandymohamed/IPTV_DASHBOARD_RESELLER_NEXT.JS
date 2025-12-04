"use client";

import { Tooltip, Box } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

// Regular function for use in format functions (not a hook)
export function spliceLongText(text: string, count: number) {
    if (!text) return <span>N/A</span>;
    
    const isLongText = text.length > count;
    const slicedText = isLongText ? text.slice(0, count) : text;

    return (
        <>
            {isLongText ? (
                <Tooltip placement="top" title={text}>
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                        <span>{slicedText} ...</span>
                        <InfoOutlined sx={{ cursor: "pointer", width: 12, height: 12 }} />
                    </Box>
                </Tooltip>
            ) : (
                <span>{slicedText}</span>
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
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: '12px' }}>
                        <span>{slicedText} ...</span>
                        <InfoOutlined sx={{ cursor: "pointer", width: 12, height: 12 }} />
                    </Box>
                </Tooltip>
            ) : (
                <span style={{ fontSize: "12px" }}>{slicedText}</span>
            )}
        </>
    );
}