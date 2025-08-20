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

interface WinnerModalProps {
    open: boolean;
    onClose: () => void;
    winnerName: string;
    onRemove: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ open, onClose, winnerName, onRemove }) => {
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
                    background:
                        "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)",
                    color: "white",
                    borderRadius: 3,
                    boxShadow: "0 0 20px rgba(255,255,255,0.15)",
                    position: "relative",
                    overflow: "hidden",
                    height: "300px",
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Tombol Close */}
                {/* <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
                >
                    <CloseIcon />
                </IconButton> */}

                {/* Animasi teks */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 10 }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: "bold",
                            textShadow: "0 0 20px rgba(255,215,0,0.8)",
                            mb: 2,
                            color: "#FFD700",
                            fontSize: 20,
                        }}
                    >
                        The Winner is
                    </Typography>

                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: "bold",
                            background: "linear-gradient(90deg, #ff8a00, #e52e71)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: "0 0 15px rgba(229,46,113,0.6)",
                            mb: 3,
                            fontSize: 60,
                        }}
                    >
                        {winnerName}
                    </Typography>

                    <Box aria-label="buttons-area"
                        sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            width: "100%",
                            justifyContent: "center",
                            mt: 5
                        }}
                    >

                        <Button
                            onClick={onClose}
                            sx={{
                                background: "linear-gradient(135deg, #2196f3, #9c27b0)", // biru ke ungu
                                color: "#fff",
                                borderRadius: "4px",
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: "0px 4px 12px rgba(33, 150, 243, 0.4)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #1976d2, #7b1fa2)", // lebih gelap pas hover
                                    boxShadow: "0px 6px 16px rgba(156, 39, 176, 0.6)",
                                },
                            }}
                        >
                            Close Dialog
                        </Button>


                        <Button
                            onClick={onRemove}
                            sx={{
                                background: "linear-gradient(135deg, #ff4b2b, #ff416c)", // merah ke pink
                                color: "#fff",
                                borderRadius: "4px",
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: "0px 4px 12px rgba(255, 65, 108, 0.4)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #ff3a1a, #ff2e63)",
                                    boxShadow: "0px 6px 16px rgba(255, 65, 108, 0.6)",
                                },
                            }}
                            autoFocus
                        >
                            Remove & Close
                        </Button>

                    </Box>
                </motion.div>



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

export default WinnerModal;
