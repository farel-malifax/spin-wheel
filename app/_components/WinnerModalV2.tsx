"use client";

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Typography
} from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import CloseIcon from '@mui/icons-material/Close';

interface WinnerModalProps {
    open: boolean;
    onClose: () => void;
    winnerName: string;
    onRemove: () => void;
}

const WinnerModalV2: React.FC<WinnerModalProps> = ({ open, onClose, winnerName, onRemove }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (open) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    backgroundColor: "transparent",
                    // color: "white",
                    borderRadius: 3,
                    boxShadow: "0 0 20px rgba(255,255,255,0.15)",
                    position: "relative",
                    overflow: "hidden",
                    height: "230px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                },
            }}
        >
            {showConfetti && (
                <Confetti width={window.innerWidth} height={window.innerHeight} />
            )}

            <DialogContent
                sx={{
                    textAlign: "center",
                    // py: 6,
                    position: "relative",
                    py: 0,
                    px: 0,
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: "center",
                    // justifyContent: "center",
                    bgcolor: "#1d1d1d",
                    width: "100%",
                }}
            >

                <Box aria-label="top-area"
                    sx={{
                        width: "100%",
                        height: "50px",
                        bgcolor: "#d50f25",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 3
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 20,
                            color: "white",
                            fontFamily: "Roboto, sans-serif",
                            fontWeight: 600,
                        }}
                    >
                        We have a winner!
                    </Typography>

                    <CloseIcon
                        onClick={onClose}
                        sx={{
                            fontSize: 25,
                            color: "white",
                            cursor: "pointer"
                        }}
                    />

                </Box>

                <Box aria-label="main-area"
                    sx={{
                        width: "100%",
                        flexGrow: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative"
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 40,
                            color: "white",
                            fontFamily: "Roboto, sans-serif",
                            fontWeight: 500,
                            mb: 5,
                        }}
                    >
                        {winnerName}
                    </Typography>

                    <Button
                        onClick={onClose}
                        sx={{
                            bgcolor: "transparent",
                            color: "white",
                            textTransform: "none",
                            position: "absolute",
                            bottom: 10, right: 90,
                            fontWeight: 700,
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={onRemove}
                        sx={{
                            bgcolor: "#3369e8",
                            color: "white",
                            textTransform: "none",
                            position: "absolute",
                            bottom: 10, right: 10,
                            fontWeight: 700,
                        }}
                    >
                        Remove
                    </Button>
                </Box>
                {/* Tombol Close */}
                {/* <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
                >
                    <CloseIcon />
                </IconButton> */}

                {/* Animasi teks */}




                {/* Extra hiasan glowing circle */}
                {/* <Box
                    sx={{
                        position: "absolute",
                        bottom: -50,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 200,
                        height: 200,
                        background: "radial-gradient(circle, rgba(255,215,0,0.3), transparent)",
                        borderRadius: "50%",
                        filter: "blur(60px)",
                        zIndex: -1,
                    }}
                /> */}
            </DialogContent>
        </Dialog>
    );
};

export default WinnerModalV2;
