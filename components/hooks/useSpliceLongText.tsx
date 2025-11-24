"use client";

import { Tooltip, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

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

                        {/* <Iconify icon={icons.tip} sx={{ cursor: "pointer", width: 12 }} /> */}
                    </Typography>
                </Tooltip>
            ) : (
                <span style={{ fontSize: "12px" }}>{slicedText}</span>
            )}
        </>
    );
}