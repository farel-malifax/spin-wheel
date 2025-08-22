/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import LogoImage from "@/app/_assets/logo-wheelofnames-removebg-preview.png";
import api from "@/lib/axios";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CreateIcon from '@mui/icons-material/Create';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LanguageIcon from '@mui/icons-material/LanguageTwoTone';
import PaletteIcon from '@mui/icons-material/Palette';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Checkbox, Typography } from '@mui/material';
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import ParticipantsEditor from '../_components/ParticipantsEditor';
import { Prize } from '../settings/page';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ImageIcon from '@mui/icons-material/Image';
import NavigationIcon from '@mui/icons-material/Navigation';
import CurvedText from "../_components/CurvedText";
import CurvedTextBottom from "../_components/CurvedTextBottom";
import WinnerModal from "../_components/WinnerModal";
import Confetti from "react-confetti";
import WinnerModalV2 from "../_components/WinnerModalV2";

type SpinPageProps = {

}
const SpinPage = (props: SpinPageProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [queues, setQueues] = useState<any[]>([]);
    const [allParticipants, setAllParticipants] = useState<{ id: number; name: string, is_deleted: boolean }[]>([]);
    const [participants, setParticipants] = useState<{ id: number; name: string }[]>([]);
    const [participantsText, setParticipantsText] = useState("");
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [queuePrize, setQueuePrize] = useState<Prize | null>(null);
    const [queueId, setQueueId] = useState<number | null>(null);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentQueue, setCurrentQueue] = useState<any | null>(null);

    const [winnerModal, setWinnerModal] = useState<boolean>(false);
    const [winnerParticipant, setWinnerParticipant] = useState<string | null>(null);
    const [winnerParticipantId, setWinnerParticipantId] = useState<number | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);


    const [displayCenterCondition, setDisplayCenterCondition] = useState<"preview" | "spin">("spin")
    const [isCenterHover, setIsCenterHover] = useState(false);

    const spinSound = useRef<HTMLAudioElement | null>(null);
    const winSound = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const nextQueue = queues.find((q: any) => q.is_spun === 0);
        if (nextQueue) {
            const prizeData = prizes.find(p => p.id === nextQueue.prize_id);
            setQueuePrize({ id: nextQueue.prize_id, name: nextQueue.prize_name, winner: prizeData?.winner ?? null, image: nextQueue.image });
            setQueueId(nextQueue.id);
            setCurrentQueue(nextQueue);
        } else {
            setQueuePrize(null);
            setQueueId(null);
            setCurrentQueue(null);
        }
    }, [queues]);

    useEffect(() => {
        let angle = 0;
        let frame: number;
        const animate = () => {
            angle += 0.007; // kecepatan muter
            drawPreviewWheel(angle);
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [participants]);

    // Inisialisasi audio
    useEffect(() => {
        // hanya jalan di client
        if (typeof window !== "undefined") {
            spinSound.current = new Audio("/sfx/spin-sfx.wav");
            winSound.current = new Audio("/sfx/complete-sfx.mp3");
        }
    }, []);

    // CTRL + Enter Event
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault(); // cegah behavior default
                spin();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (isCenterHover) {
            if (displayCenterCondition !== "spin") setDisplayCenterCondition("spin");
            return;
        }

        const interval = setInterval(() => {
            setDisplayCenterCondition((prev) => prev === "spin" ? "preview" : "spin");
        }, 3000);

        return () => clearInterval(interval);
        // Dependency hanya isCenterHover dan displayCenterCondition
    }, [isCenterHover, displayCenterCondition]);

    const loadData = async () => {
        try {
            const [participantsRes, prizesRes, queueRes] = await Promise.all([
                api.get("/participants"),
                api.get("/prizes"),
                api.get("/queue"),
            ]);
            const participantsList: Array<{ id: number; name: string }> =
                participantsRes.data
                    .filter((p: any) => p.is_deleted !== 1) // <--- filter di sini
                    .map((p: any) => ({ id: p.id, name: p.name }));

            const allParticipantsList: Array<{ id: number; name: string, is_deleted: boolean }> =
                participantsRes.data
                    .map((p: any) => ({ id: p.id, name: p.name, is_deleted: p.is_deleted }));

            setParticipants(participantsList);
            setAllParticipants(allParticipantsList)
            setParticipantsText(participantsList.map(p => p.name).join("\n"));
            setPrizes(prizesRes.data);

            // Ambil prize dari queue dengan order_num terendah dan is_spun = 0
            const queueList = queueRes.data;
            setQueues(queueList);
            const nextQueue = queueList.find((q: any) => q.is_spun === 0);
            if (nextQueue) {
                const prizeData = prizes.find(p => p.id === nextQueue.prize_id);
                setQueuePrize({ id: nextQueue.prize_id, name: nextQueue.prize_name, winner: prizeData?.winner ?? null, image: nextQueue.image });
                setQueueId(nextQueue.id);
            } else {
                setQueuePrize(null);
                setQueueId(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Initial Fetch Data
    useEffect(() => {
        loadData();
    }, []);

    // Auto Fetch Every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isSpinning) {
                loadData();
            }
        }, (10 * 1000));

        return () => clearInterval(interval);
    }, [isSpinning]);


    // Delete Participant
    const deleteParticipant = async (id: number) => {
        try {
            await axios.patch(`/api/participants/`, { id, is_deleted: true });
            setParticipants(participants.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const resetParticipants = async () => {
        try {
            // update semua participant jadi is_deleted = false
            await Promise.all(
                allParticipants.map((p) =>
                    axios.patch(`/api/participants/`, { id: p.id, is_deleted: false })
                )
            );

            // update state di frontend juga
            loadData()
            // setParticipants(
            //   participants.map((p) => ({
            //     ...p,
            //     is_deleted: false,
            //   }))
            // );

            console.log("All participants reset successfully");
        } catch (error) {
            console.error("Failed to reset participants:", error);
        }
    };


    // Draw wheel
    const drawWheel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = canvas.width;
        const radius = size / 2;
        ctx.clearRect(0, 0, size, size);

        if (participants.length === 0) return;

        const arc = (2 * Math.PI) / participants.length;
        participants.forEach((name, i) => {
            const angle = i * arc + (rotation * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, angle, angle + arc);
            const colors = ["#009925", "#eeb211", "#d50f25", "#3369e8"];
            // ctx.fillStyle = i % 2 === 0 ? "#6C63FF" : "#C77DFF";
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            const bgColor = colors[i % colors.length];
            if (bgColor === "#d50f25" || bgColor === "#3369e8") {
                ctx.fillStyle = "#fff"; // font putih
            } else {
                ctx.fillStyle = "#000"; // font hitam
            }
            ctx.font = "12px sans-serif";
            // ctx.fillText(name, radius - 10, 5);
            // ctx.fillText(capitalizeWords(name.name), radius - 10, 5);
            ctx.fillText(name.name, radius - 10, 5);
            ctx.restore();
        });
    };

    const drawPreviewWheel = (angle: number) => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = canvas.width;
        const radius = size / 2;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle);
        ctx.translate(-radius, -radius);

        // pakai drawWheel tapi diarahkan ke ctx preview
        // copy paste isi drawWheel ke sini,
        // bedanya: jangan ambil ctx dari canvasRef, pakai ctx yang udah ada

        if (participants.length === 0) {
            ctx.restore();
            return;
        }

        const arc = (2 * Math.PI) / participants.length;
        participants.forEach((name, i) => {
            const angleSeg = i * arc;
            ctx.beginPath();
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, angleSeg, angleSeg + arc);
            const colors = ["#009925", "#eeb211", "#d50f25", "#3369e8"];
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate(angleSeg + arc / 2);
            ctx.textAlign = "right";
            const bgColor = colors[i % colors.length];
            ctx.fillStyle = (bgColor === "#d50f25" || bgColor === "#3369e8") ? "#fff" : "#000";
            ctx.font = "12px sans-serif";
            ctx.fillText(name.name, radius - 10, 5);
            ctx.restore();
        });

        ctx.restore();
    };

    useEffect(() => {
        drawWheel();
    }, [rotation, participants]);

    // Spin logic
    const animateSpin = (from: number, to: number, duration: number, onFinish?: () => void) => {
        const start = performance.now();
        setIsSpinning(true);

        const animate = (time: number) => {
            const progress = Math.min((time - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setRotation(from + (to - from) * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                spinSound.current?.pause();
                spinSound.current!.currentTime = 0;
                setIsSpinning(false);
                winSound.current?.play();
                if (onFinish) onFinish();
            }
        };

        requestAnimationFrame(animate);
    };

    const spin = async () => {
        console.log('SPIN')
        console.log({ participants })
        setIsSpinning(true);
        console.log({ queuePrize });

        let winnerObj: { id: number; name: string } | undefined;
        let winnerIndex: number;
        let prizeId: number | null = null;

        spinSound.current?.play();

        if (queuePrize && queueId) {
            // --- kalau ada queue, pakai winner dari queue
            winnerObj = participants.find((p) => p.name === queuePrize.winner);
            if (!winnerObj) {
                alert("Tidak ada peserta dengan nama sesuai prize");
                setIsSpinning(false);
                return;
            }
            winnerIndex = participants.findIndex((p) => p.name === queuePrize.winner);
            prizeId = queuePrize.id ?? 0;
        } else {
            // --- kalau queue kosong, ambil random participant
            if (participants.length === 0) {
                alert("Tidak ada peserta untuk dipilih");
                setIsSpinning(false);
                return;
            }
            winnerIndex = Math.floor(Math.random() * participants.length);
            winnerObj = participants[winnerIndex];
        }

        const A = 360 / participants.length;
        const centerDeg = winnerIndex * A + A / 2;

        // Top Center
        // const centerDegFromPointer = (centerDeg - 90 + 180 + 360) % 360;

        // Right Center
        const centerDegFromPointer = (centerDeg - 0 + 360) % 360;

        const baseRotation = rotation % 360;
        const delta = (360 - centerDegFromPointer - baseRotation + 360) % 360;

        const extraTurns = 5 * 360;
        const finalRotation = rotation + extraTurns + delta;

        animateSpin(rotation, finalRotation, 10000, async () => {
            if (queueId) {
                // update queue kalau memang dari queue
                await axios.patch("/api/queue", {
                    id: queueId,
                    is_spun: 1,
                });
            }

            // kalau mau simpan ke winners table, bisa cek prizeId null / tidak
            // await axios.post("/api/winners", {
            //   prize_id: prizeId,
            //   participant_id: winnerObj?.id,
            //   won_at: new Date().toISOString()
            // });

            setWinnerModal(true);
            setWinnerParticipant(winnerObj!.name);
            setWinnerParticipantId(winnerObj!.id);
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 10000);
            return () => clearTimeout(timer);
        });
    };



    return (
        <Box aria-label='spin-page' id="spin-page"
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#121212",
            }}
        >

            {showConfetti && (
                <Confetti width={window.innerWidth} height={window.innerHeight} />
            )}

            <Box aria-label='top-area'
                sx={{
                    width: "100%",
                    paddingX: 2,
                    paddingY: 1,
                    bgcolor: "#3369e8",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box aria-label='logo-area'
                    sx={{
                        display: "flex", alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Box aria-label='logo-container'
                        sx={{
                            width: 40, height: 40,
                            bgcolor: "#022a4e",
                            borderRadius: "50%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Box aria-label='logo-img'
                            component={"img"}
                            src={LogoImage.src}
                            sx={{
                                width: 39, height: 39,
                            }}
                        />
                    </Box>

                    <Typography
                        sx={{
                            fontSize: 25,
                            color: "white",
                            fontWeight: 400,
                            fontFamily: "Roboto, sans-serif",
                        }}
                    >
                        wheelofnames.com
                    </Typography>
                </Box>

                <Box aria-label='actions-area'
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >

                    <Box aria-label='customize-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <PaletteIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            Customize
                        </Typography>
                    </Box>

                    <Box aria-label='new-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <InsertDriveFileIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            New
                        </Typography>
                    </Box>

                    <Box aria-label='open-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <FolderCopyIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            Open
                        </Typography>
                    </Box>

                    <Box aria-label='save-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <SaveIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            Save
                        </Typography>
                    </Box>

                    <Box aria-label='share-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <ShareIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            Share
                        </Typography>
                    </Box>

                    <Box aria-label='gallery-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <SearchIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            Gallery
                        </Typography>
                    </Box>

                    <FullscreenIcon aria-label='full-screen-icon'
                        sx={{
                            fontSize: 25,
                            color: "white",
                        }}
                    />

                    <Box aria-label='more-area'
                        sx={{
                            display: "flex",
                            gap: 0.8,
                            alignItems: "center",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            More
                        </Typography>

                        <ArrowDropDownIcon
                            sx={{
                                fontSize: 30,
                                color: "white",
                            }}
                        />
                    </Box>

                    <Box aria-label='language-area'
                        sx={{
                            display: "flex",
                            gap: 1.2,
                            alignItems: "center",
                        }}
                    >
                        <LanguageIcon
                            sx={{
                                fontSize: 20,
                                color: "white",
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 17,
                                color: "white",
                                fontWeight: 500,
                                fontFamily: "Roboto, sans-serif",
                                lineHeight: 0.8
                            }}
                        >
                            English
                        </Typography>
                    </Box>

                </Box>
            </Box>

            <Box aria-label='main-area'
                sx={{
                    flexGrow: 1,
                    width: "100%",
                    height: "90%",
                    paddingTop: 2,
                    paddingX: 2,
                    display: "flex",
                    justifyContent: "space-between"
                }}
            >
                <Box aria-label='pencil-area'
                    sx={{
                        width: 40, height: 40,
                        bgcolor: "#3369e8",
                        borderRadius: "50%",
                        display: "flex", justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <CreateIcon
                        sx={{
                            fontSize: 25,
                            color: "white"
                        }}
                    />
                </Box>

                <Box aria-label="main-area"
                    sx={{
                        display: "flex",
                        height: "100%",
                        gap: 10,
                    }}
                >

                    <Box aria-label="wheel-container"
                        alignSelf={"center"}
                        position={"relative"} width={580} height={580}
                    >
                        {/* Main Canvas */}
                        <canvas ref={canvasRef} width={580} height={580}
                            onClick={spin}
                            style={{
                                cursor: "pointer"
                            }}
                        />

                        {/* Preview Canvas */}
                        {!isSpinning && (
                            <canvas ref={previewCanvasRef} width={580} height={580}
                                onClick={spin}
                                style={{
                                    cursor: "pointer",
                                    opacity: 1,
                                    position: "absolute",
                                    top: 0, left: 0,
                                }}
                            />
                        )}

                        <Box aria-label="center-content"
                            // onMouseEnter={() => setDisplayCenterCondition("spin")}
                            onClick={spin}
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "110px", height: "110px",
                                display: "flex",
                                justifyContent: "center", alignItems: "center",
                                bgcolor: "white",
                                borderRadius: "50%",
                                cursor: "pointer",
                            }}
                        >
                            {/* <Typography aria-label="center-text"
                                sx={{
                                    fontSize: {
                                        mobile: 12,
                                        tabPot: 12,
                                        tabLan: 12,
                                        desktop: 12,
                                    },
                                    color: "black"
                                }}
                            >
                                SPIN
                            </Typography> */}
                        </Box>

                        {!isSpinning && (
                            <CurvedText />
                        )}

                        {!isSpinning && (
                            <CurvedTextBottom />
                        )}


                        {/* <Box aria-label="target-top"
                            sx={{
                                position: "absolute",
                                top: -10,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: 0,
                                height: 0,
                                borderLeft: "18px solid transparent",
                                borderRight: "18px solid transparent",
                                borderTop: "28px solid #f44336", // warna segitiga
                                pointerEvents: "none",
                            }}
                        /> */}
                        <NavigationIcon
                            sx={{
                                position: "absolute",
                                right: -30,
                                top: "50%",
                                transform: "translateY(-50%) rotate(270deg)",
                                pointerEvents: "none",
                                fontSize: 50,
                                color: "#eeb211"
                            }}
                        />
                    </Box>

                    <Box aria-label='action-area'
                        sx={{
                            width: "350px",
                        }}
                    >
                        <Box aria-label='top-area'
                            sx={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <Box aria-label='left-area'
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Box aria-label='entries-area'
                                    sx={{
                                        width: "120px",
                                        paddingY: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 0.7,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 15,
                                            color: "white",
                                            fontWeight: 600,
                                            fontFamily: "Roboto, sans-serif",
                                            lineHeight: 0.8
                                        }}
                                    >
                                        Entries
                                    </Typography>
                                    <Box aria-label='length-area'
                                        sx={{
                                            width: 15, height: 15,
                                            bgcolor: "#757575",
                                            borderRadius: "45%",
                                            display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 10,
                                                color: "white",
                                                fontWeight: 400,
                                                fontFamily: "Roboto, sans-serif",
                                                lineHeight: 0.8,
                                                mt: 0.1
                                            }}
                                        >
                                            {participants.length}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box aria-label='results-area'
                                    sx={{
                                        width: "120px",
                                        paddingY: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 0.7,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 15,
                                            color: "white",
                                            fontWeight: 600,
                                            fontFamily: "Roboto, sans-serif",
                                            lineHeight: 0.8
                                        }}
                                    >
                                        Results
                                    </Typography>
                                    <Box aria-label='length-area'
                                        sx={{
                                            width: 15, height: 15,
                                            bgcolor: "#757575",
                                            borderRadius: "45%",
                                            display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 10,
                                                color: "white",
                                                fontWeight: 400,
                                                fontFamily: "Roboto, sans-serif",
                                                lineHeight: 0.8,
                                                mt: 0.1
                                            }}
                                        >
                                            8
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box aria-label='checkbox-area'
                                sx={{
                                    display: "flex", alignItems: "center",
                                    mr: 2,
                                    // gap: 1,
                                }}
                            >
                                <Checkbox sx={{ color: "white", transform: "scale(0.8)", "&.Mui-checked": { color: "white" } }} />
                                <Typography sx={{ color: "white", fontSize: 14, mr: 0.3 }}>Hide</Typography>
                            </Box>
                        </Box>

                        <Box aria-label="content-area"
                            sx={{
                                // flex: 1,
                                height: "90%",
                                bgcolor: "#1d1d1d",
                                borderRadius: "5px",
                                paddingX: 2,
                                paddingY: 2,
                                display: "flex", flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <Box aria-label="top-area"
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    gap: 1,
                                }}
                            >
                                <Box aria-label="shufle-area"
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        paddingX: 1.2,
                                        paddingY: 0.5,
                                        bgcolor: "#424242",
                                        borderRadius: 1.1,
                                    }}
                                >
                                    <ShuffleIcon sx={{ color: "white", fontSize: 18, fontWeight: 600, }} />

                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            color: "white",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Shuffle
                                    </Typography>
                                </Box>

                                <Box aria-label="sort-area"
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        paddingX: 1.2,
                                        paddingY: 0.5,
                                        bgcolor: "#424242",
                                        borderRadius: 1.1,
                                    }}
                                >
                                    <SortByAlphaIcon sx={{ color: "white", fontSize: 18, fontWeight: 600, }} />

                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            color: "white",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Sort
                                    </Typography>
                                </Box>

                                <Box aria-label="add-image-area"
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0,
                                        paddingX: 1.2,
                                        paddingY: 0.5,
                                        bgcolor: "#424242",
                                        borderRadius: 1.1,
                                    }}
                                >
                                    <ImageIcon sx={{ color: "white", fontSize: 18, fontWeight: 600, }} />

                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            color: "white",
                                            fontWeight: 600,
                                            ml: 0.3
                                        }}
                                    >
                                        Add Image
                                    </Typography>

                                    <ArrowDropDownIcon sx={{ color: "white", fontSize: 25, fontWeight: 600, }} />
                                </Box>
                            </Box>

                            <Box aria-label='checkbox-area'
                                sx={{
                                    display: "flex", alignItems: "center",
                                    mr: 2,
                                    // gap: 1,
                                }}
                            >
                                <Checkbox sx={{ color: "white", transform: "scale(0.5),", ml: 0.5, "&.Mui-checked": { color: "white" } }} />
                                <Typography sx={{ color: "white", fontSize: 14, mr: 0.5 }}>Advanced</Typography>
                            </Box>

                            <ParticipantsEditor
                                participantsText={participantsText}
                                setParticipantsText={setParticipantsText}
                                textFieldProps={{
                                    multiline: true,
                                    minRows: 10,
                                    maxRows: 16,
                                    sx: {
                                        width: "100%",
                                        height: "410px",
                                        "& .MuiInputBase-root": {
                                            color: "white", // font color
                                        },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#626262",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#626262",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#626262",
                                        },
                                        "& textarea": {
                                            overflow: "hidden", // hilangkan scrollbar
                                        },
                                    }

                                }}
                            />

                            <Box aria-label="bottom-area"
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        color: "white",
                                        fontWeight: 400,
                                        fontFamily: "Roboto, sans-serif",
                                        lineHeight: 0.8,
                                    }}
                                >
                                    Version 377
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        color: "#305fdd",
                                        fontWeight: 400,
                                        fontFamily: "Roboto, sans-serif",
                                        lineHeight: 1,
                                        textDecoration: "underline"
                                    }}
                                >
                                    Changelog
                                </Typography>
                            </Box>
                        </Box>

                    </Box>
                </Box>
            </Box>


            {/* Modal Area */}
            {winnerParticipant && winnerParticipantId &&
                <WinnerModalV2
                    open={winnerModal}
                    onClose={() => setWinnerModal(false)}
                    winnerName={winnerParticipant}
                    onRemove={() => {
                        deleteParticipant(winnerParticipantId)
                        setWinnerModal(false)
                    }}
                />
            }

        </Box>
    );
};

export default SpinPage;

