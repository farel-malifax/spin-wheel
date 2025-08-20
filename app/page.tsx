"use client";
import api from "@/lib/axios";
import GroupsIcon from '@mui/icons-material/Groups';
import {
  Box,
  Button,
  Typography
} from "@mui/material";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import ParticipantsEditor from "./_components/ParticipantsEditor";
import WinnerModal from "./_components/WinnerModal";
import { Prize } from "./settings/page";


export default function WheelPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Inisialisasi audio
  useEffect(() => {
    // hanya jalan di client
    if (typeof window !== "undefined") {
      spinSound.current = new Audio("/sfx/spin-sfx.wav");
      winSound.current = new Audio("/sfx/complete-sfx.mp3");
    }
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
      const colors = ["#6C63FF", "#C77DFF", "#FF6B6B", "#4ECDC4", "#FFD93D"];
      // ctx.fillStyle = i % 2 === 0 ? "#6C63FF" : "#C77DFF";
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      // ctx.fillText(name, radius - 10, 5);
      // ctx.fillText(capitalizeWords(name.name), radius - 10, 5);
      ctx.fillText(name.name, radius - 10, 5);
      ctx.restore();
    });
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
    const centerDegFromPointer = (centerDeg - 90 + 180 + 360) % 360;

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
    <Box aria-label="main-page"
      sx={{
        p: 4,
        bgcolor: "#121212",
        height: "100vh",
      }}
    >

      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      <Box aria-label="content-container"
        sx={{
          p: 2,
          textAlign: "center",
          display: "flex",
          // flexDirection: "column",
          gap: 1,
          // alignItems: "center",
          position: "relative",
          justifyContent: "space-between",

        }}>

        {/* Prize dari queue, tidak bisa dipilih manual */}
        <Box />


        <Box aria-label="wheel-container"
          position={"relative"} width={600} height={600}
        >
          <canvas ref={canvasRef} width={600} height={600} />

          <Box aria-label="center-content"
            onMouseEnter={() => setDisplayCenterCondition("spin")}
            onClick={spin}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90px", height: "90px",
              display: "flex",
              justifyContent: "center", alignItems: "center",
              bgcolor: "#FF6FFF",
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            <Typography aria-label="center-text"
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
            </Typography>
          </Box>

          <Box aria-label="target-top"
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
          />
        </Box>

        <Box aria-label="right-area"
          sx={{
            display: "flex", flexDirection: "column",
            gap: 3,
          }}
        >

          <Box aria-label="actions-area"
            sx={{
              display: "flex", justifyContent: "start"
            }}
          >
            <Button onClick={resetParticipants}
              variant="outlined"
              sx={{
                borderColor: "white",
                "&:hover": {
                  borderColor: "white",
                },
                color: "white",
                textTransform: "none"
              }}
            // color="primary"
            >
              Reset Participants
            </Button>
          </Box>

          <Box aria-label="participants-area"
            sx={{
              display: "flex", flexDirection: "column",
              alignItems: "start",
              gap: 1
            }}
          >
            <Box aria-label="label-container"
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center"
              }}
            >
              <GroupsIcon sx={{
                color: "white",
                fontSize: 30
              }} />
              <Typography aria-label="participant-label"
                sx={{
                  fontSize: {
                    mobile: 10,
                    tabPot: 10,
                    tabLan: 14,
                    desktop: 14,
                  },
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Participants
              </Typography>

            </Box>
            <ParticipantsEditor
              participantsText={participantsText}
              setParticipantsText={setParticipantsText}
              textFieldProps={{
                multiline: true,
                minRows: 20,
                maxRows: 20,
                sx: {
                  width: "250px",
                  height: "100px",
                  "& .MuiInputBase-root": {
                    color: "white", // font color
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "white", // biar border juga keliatan
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "white",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "white",
                  },
                  "& textarea": {
                    scrollbarWidth: "thin", // Firefox
                    scrollbarColor: "#888 transparent",

                    "&::-webkit-scrollbar": {
                      width: "6px", // tipis
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#888",
                      borderRadius: "10px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                  },
                },
              }}
            />

          </Box>

          {/* <Box aria-label="prizes-area"
            sx={{
              display: "flex", flexDirection: "column",
              alignItems: "start",
              gap: 1
            }}
          >
            <Box aria-label="label-container"
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center"
              }}
            >
              <CardGiftcardIcon sx={{
                color: "white",
                fontSize: 30
              }} />
              <Typography aria-label="prize-label"
                sx={{
                  fontSize: 14,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Prizes
              </Typography>

            </Box>

            {prizes.map((prize, index) => (
              <Box aria-label="prize-box" key={index}
                sx={{
                  width: "100%", border: "1px solid white",
                  borderRadius: 1,
                  padding: 2,
                  boxSizing: "border-box",
                  display: "flex",
                  justifyContent: "start"
                }}
              >
                <Typography aria-label="prize-text"
                  sx={{
                    fontSize: 14,
                    color: "white"
                  }}
                >
                  {prize.name}
                </Typography>
              </Box>
            ))}

          </Box> */}
        </Box>
      </Box>


      {/* Modal Area */}
      {winnerParticipant && winnerParticipantId &&
        <WinnerModal
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
}
