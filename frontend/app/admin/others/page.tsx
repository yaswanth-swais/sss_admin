"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { othersTexts } from "./othersTexts";

import {
  Bell,
  Send,
  Users,
  User,
  Calendar,
  Trophy,
  Music,
  Bus,
  Plus,
  X,
  Mail,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Mic,
  Volume2,
} from "lucide-react";

import {
  textToVoice,
  voiceToText,
} from "../../services/adminAIService";

interface Notification {
  id: string;
  title: string;
  message: string;
  role: string;
  date: string;
  status: string;
  is_read: boolean;
}

interface Event {
  id: string;
  title: string;
  type: "tour" | "function" | "activity";
  date: string;
  description: string;
  location?: string;
}

export default function OthersPage() {
  /* -------------------------------------------------------------------------- */
  /*                         LANGUAGE / TRANSLATION                              */
  /* -------------------------------------------------------------------------- */

  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  const t = (key: keyof typeof othersTexts) =>
    translations?.[key] || othersTexts[key];

  /* -------------------------------------------------------------------------- */
  /*                                  STATES                                    */
  /* -------------------------------------------------------------------------- */

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: "E1",
      title: "Science Museum Visit",
      type: "tour",
      date: "2026-05-10",
      description:
        "Educational tour for class 8 to 10 students.",
      location: "Hyderabad Science Museum",
    },
    {
      id: "E2",
      title: "Annual Day Celebrations",
      type: "function",
      date: "2026-04-29",
      description:
        "Annual day with cultural activities.",
    },
    {
      id: "E3",
      title: "Annual Sports Day",
      type: "activity",
      date: "2026-06-15",
      description:
        "Annual sports competition with various games.",
    },
  ]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<"notifications" | "events">(
      "notifications"
    );

  const [
    showNotificationModal,
    setShowNotificationModal,
  ] = useState(false);

  const [showEventModal, setShowEventModal] =
    useState(false);

  const [
    editingNotification,
    setEditingNotification,
  ] = useState<Notification | null>(null);

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState<Notification | null>(null);

  const [editingEvent, setEditingEvent] =
    useState<Event | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isRecording, setIsRecording] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [selectedRole, setSelectedRole] =
    useState<string>("all");

  const [validationError, setValidationError] =
    useState("");

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [newNotification, setNewNotification] =
    useState({
      title: "",
      message: "",
    });

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "function" as
      | "tour"
      | "function"
      | "activity",
    date: "",
    description: "",
    location: "",
  });

  /* -------------------------------------------------------------------------- */
  /*                              INITIAL LOAD                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    fetchNotifications();

    return () => {
      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);


  const getDynamicTexts = () => {
  const dynamicTexts: Record<string, string> = {};

  notifications.forEach((notification) => {
    if (notification.title) {
      dynamicTexts[`noticeTitle_${notification.id}`] =
        notification.title;
    }

    if (notification.message) {
      dynamicTexts[`noticeMessage_${notification.id}`] =
        notification.message;
    }

    if (notification.role) {
      dynamicTexts[`noticeRole_${notification.id}`] =
        notification.role;
    }
  });

  events.forEach((event) => {
    if (event.title) {
      dynamicTexts[`eventTitle_${event.id}`] =
        event.title;
    }

    if (event.description) {
      dynamicTexts[`eventDescription_${event.id}`] =
        event.description;
    }

    if (event.location) {
      dynamicTexts[`eventLocation_${event.id}`] =
        event.location;
    }

    if (event.type) {
      dynamicTexts[`eventType_${event.id}`] =
        event.type;
    }
  });

  return dynamicTexts;
};

  /* -------------------------------------------------------------------------- */
  /*                            BULK TRANSLATION                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    translateBulk(othersTexts);
  }, [language]);

  useEffect(() => {
  if (language === "English") {
    return;
  }

  if (
    notifications.length === 0 &&
    events.length === 0
  ) {
    return;
  }

  const dynamicTexts = getDynamicTexts();

  if (Object.keys(dynamicTexts).length > 0) {
    translateBulk(dynamicTexts);
  }
}, [language, notifications, events]);

  /* -------------------------------------------------------------------------- */
  /*                         FETCH NOTIFICATIONS                                */
  /* -------------------------------------------------------------------------- */

  const fetchNotifications = async () => {
    try {
      const response =
        await fetch("/api/notices");

      const data = await response.json();

      console.log(
        "NOTICES API STATUS:",
        response.status
      );

      console.log(
        "NOTICES API RESPONSE:",
        data
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch notices:",
          data
        );

        setNotifications([]);
        return;
      }

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (
        Array.isArray(data?.notices)
      ) {
        setNotifications(data.notices);
      } else {
        console.error(
          "Unexpected notices response:",
          data
        );

        setNotifications([]);
      }
    } catch (error) {
      console.error(
        "Error fetching notices:",
        error
      );

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             VALIDATION                                     */
  /* -------------------------------------------------------------------------- */

  const validateNotice = () => {
    if (!newNotification.title.trim()) {
      setValidationError(
        t("noticeTitleRequired")
      );

      return false;
    }

    if (!newNotification.message.trim()) {
      setValidationError(
        t("noticeMessageRequired")
      );

      return false;
    }

    setValidationError("");

    return true;
  };

  /* -------------------------------------------------------------------------- */
  /*                         NOTIFICATION CRUD                                  */
  /* -------------------------------------------------------------------------- */

  const handleSendNotification =
    async () => {
      if (!validateNotice()) return;

      try {
        const response = await fetch(
          "/api/notices",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title: newNotification.title,
              message:
                newNotification.message,
              role: selectedRole,
              date: new Date()
                .toISOString()
                .split("T")[0],
            }),
          }
        );

        if (response.ok) {
          await fetchNotifications();

          setShowNotificationModal(false);

          setNewNotification({
            title: "",
            message: "",
          });

          setEditingNotification(null);

          setSelectedRole("all");

          setValidationError("");
        }
      } catch (error) {
        console.error(
          "Error sending notification:",
          error
        );

        setValidationError(
          t("failedSendNotification")
        );
      }
    };

  const handleModifyNotification = (
    notification: Notification
  ) => {
    setEditingNotification(notification);

    setNewNotification({
      title: notification.title,
      message: notification.message,
    });

    setSelectedRole(
      notification.role || "all"
    );

    setValidationError("");

    setShowNotificationModal(true);
  };

  const handleDeleteNotification =
    async (id: string) => {
      if (
        !confirm(
          t(
            "deleteNotificationConfirmation"
          )
        )
      ) {
        return;
      }

      try {
        await fetch(
          `/api/notices?id=${id}`,
          {
            method: "DELETE",
          }
        );

        await fetchNotifications();
      } catch (error) {
        console.error(
          "Error deleting notice:",
          error
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                               EVENT CRUD                                   */
  /* -------------------------------------------------------------------------- */

  const handleAddEvent = () => {
    const event: Event = {
      id: `E${events.length + 1}`,
      ...newEvent,
    };

    setEvents([...events, event]);

    setShowEventModal(false);

    setNewEvent({
      title: "",
      type: "function",
      date: "",
      description: "",
      location: "",
    });

    setEditingEvent(null);
  };

  const handleModifyEvent = (
    event: Event
  ) => {
    setEditingEvent(event);

    setNewEvent({
      title: event.title,
      type: event.type,
      date: event.date,
      description: event.description,
      location: event.location || "",
    });

    setShowEventModal(true);
  };

  const handleDeleteEvent = (
    id: string
  ) => {
    if (
      confirm(
        t("deleteEventConfirmation")
      )
    ) {
      setEvents(
        events.filter(
          (event) => event.id !== id
        )
      );
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              HELPERS                                       */
  /* -------------------------------------------------------------------------- */

  const getEventIcon = (
    type: string
  ) => {
    switch (type) {
      case "tour":
        return (
          <Bus className="w-5 h-5" />
        );

      case "function":
        return (
          <Music className="w-5 h-5" />
        );

      default:
        return (
          <Trophy className="w-5 h-5" />
        );
    }
  };

  const getEventColor = (
    type: string
  ) => {
    switch (type) {
      case "tour":
        return "from-cyan-500 to-blue-500";

      case "function":
        return "from-purple-500 to-pink-500";

      default:
        return "from-orange-500 to-yellow-500";
    }
  };

  const getRoleColor = (
    role: string
  ) => {
    const roleLower =
      role?.toLowerCase() || "";

    if (
      roleLower.includes("student")
    ) {
      return "bg-blue-500/20 text-blue-400";
    }

    if (
      roleLower.includes("teacher") ||
      roleLower.includes("faculty")
    ) {
      return "bg-purple-500/20 text-purple-400";
    }

    return "bg-green-500/20 text-green-400";
  };

  /* -------------------------------------------------------------------------- */
  /*                           VOICE TO TEXT                                    */
  /* -------------------------------------------------------------------------- */

  const handleVoiceToText =
    async () => {
      if (isRecording) {
        mediaRecorderRef.current?.stop();
        return;
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        mediaStreamRef.current =
          stream;

        const mediaRecorder =
          new MediaRecorder(stream);

        mediaRecorderRef.current =
          mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (
          event: BlobEvent
        ) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

        mediaRecorder.onstop =
          async () => {
            setIsRecording(false);

            try {
              const mimeType =
                mediaRecorder.mimeType ||
                "audio/webm";

              const audioBlob =
                new Blob(
                  audioChunksRef.current,
                  {
                    type: mimeType,
                  }
                );

              const extension =
                mimeType.includes("ogg")
                  ? "ogg"
                  : mimeType.includes(
                      "mp4"
                    )
                  ? "mp4"
                  : "webm";

              const audioFile =
                new File(
                  [audioBlob],
                  `recording.${extension}`,
                  {
                    type: mimeType,
                  }
                );

              const formData =
                new FormData();

              formData.append(
                "file",
                audioFile
              );

              formData.append(
                "language",
                "English"
              );

              formData.append(
                "user_email",
                "admin@sss.edu"
              );

              formData.append(
                "client_name",
                "SSS"
              );

              const response =
                await voiceToText(
                  formData
                );

              console.log(
                "VOICE TO TEXT RESPONSE:",
                response
              );

              const transcribedText =
                response?.text ||
                response?.transcription ||
                response?.transcribed_text;

              if (transcribedText) {
                setSearchTerm(
                  transcribedText
                );
              } else {
                alert(
                  t(
                    "transcriptionNotReceived"
                  )
                );
              }
            } catch (error) {
              console.error(
                "Voice to Text failed:",
                error
              );

              alert(
                t("voiceToTextFailed")
              );
            } finally {
              mediaStreamRef.current
                ?.getTracks()
                .forEach((track) =>
                  track.stop()
                );

              mediaStreamRef.current =
                null;

              mediaRecorderRef.current =
                null;

              audioChunksRef.current = [];
            }
          };

        mediaRecorder.start();

        setIsRecording(true);
      } catch (error) {
        console.error(
          "Microphone access failed:",
          error
        );

        alert(
          t("microphonePermission")
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                           TEXT TO VOICE                                    */
  /* -------------------------------------------------------------------------- */

  const handleTextToVoice =
    async () => {
      if (
        isPlaying &&
        audioRef.current
      ) {
        audioRef.current.pause();

        audioRef.current.currentTime = 0;

        audioRef.current = null;

        setIsPlaying(false);

        return;
      }

      if (!selectedNotification) {
        alert(
          t(
            "selectNotificationFirst"
          )
        );

        return;
      }

      const text =
        selectedNotification.message?.trim();

      if (!text) {
        alert(
          t("notificationEmpty")
        );

        return;
      }

      try {
        const response =
          await textToVoice({
            text,
            language: "English",
            user_email:
              "admin@sss.edu",
            client_name: "SSS",
          });

        console.log(
          "TEXT TO VOICE RESPONSE:",
          response
        );

        if (
          !response?.audio_base64
        ) {
          alert(
            t("audioNotReceived")
          );

          return;
        }

        const audio = new Audio(
          `data:audio/mpeg;base64,${response.audio_base64}`
        );

        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);

          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsPlaying(false);

          audioRef.current = null;
        };

        setIsPlaying(true);

        await audio.play();
      } catch (error) {
        console.error(
          "Notification Text to Voice failed:",
          error
        );

        setIsPlaying(false);

        audioRef.current = null;

        alert(
          t("textToVoiceFailed")
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                                FILTER                                     */
  /* -------------------------------------------------------------------------- */

  const filteredNotifications =
    notifications.filter(
      (notification) =>
        notification.title
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||
        notification.message
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
    );

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  /* -------------------------------------------------------------------------- */
  /*                                UI                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      {/* TRANSLATING OVERLAY */}

      {translating &&
        language !== "English" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 text-white shadow-2xl">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              <span>
                {t("translating")}{" "}
                {language}...
              </span>
            </div>
          </div>
        )}

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" />

            {t("pageTitle")}
          </h1>

          <p className="text-white/60">
            {t("pageSubtitle")}
          </p>
        </div>

        {/* TABS */}

        <div className="flex gap-4 mb-8">
          <button
            onClick={() =>
              setActiveTab(
                "notifications"
              )
            }
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab ===
              "notifications"
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
            }`}
          >
            <Bell size={18} />

            {t("notifications")}

            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs text-white">
                {unreadCount}{" "}
                {t("new")}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setActiveTab("events")
            }
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "events"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
            }`}
          >
            <Calendar size={18} />

            {t("eventsTours")}
          </button>
        </div>

        {/* NOTIFICATIONS */}

        {activeTab ===
          "notifications" && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            {/* SEARCH */}

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  placeholder={t(
                    "searchNotices"
                  )}
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  className="w-full px-4 py-3 pr-16 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />

                <button
                  type="button"
                  onClick={
                    handleVoiceToText
                  }
                  title={
                    isRecording
                      ? t(
                          "stopRecording"
                        )
                      : t(
                          "startRecording"
                        )
                  }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                >
                  <Mic size={20} />
                </button>
              </div>
            </div>

            {/* LISTEN */}

            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={
                  handleTextToVoice
                }
                disabled={
                  !selectedNotification &&
                  !isPlaying
                }
                title={
                  isPlaying
                    ? t("stopAudio")
                    : selectedNotification
                    ? `${t(
                        "listenSelectedNotice"
                      )}: ${
                        selectedNotification.title ||
                        t(
                          "selectedNotification"
                        )
                      }`
                    : t(
                        "selectNotificationFirst"
                      )
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                  isPlaying
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : selectedNotification
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                <Volume2 size={20} />

                {isPlaying
                  ? t("stop")
                  : selectedNotification
                  ? t(
                      "listenSelectedNotice"
                    )
                  : t("selectNotice")}
              </button>
            </div>

            {/* NOTIFICATION LIST */}

            {loading ? (
              <div className="text-center py-8 text-white/60">
                {t(
                  "loadingNotifications"
                )}
              </div>
            ) : filteredNotifications.length ===
              0 ? (
              <div className="text-center py-8 text-white/60">
                {t(
                  "noNotifications"
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(
                  (
                    notification,
                    index
                  ) => (
                    <motion.div
                      key={
                        notification.id
                      }
                      onClick={() =>
                        setSelectedNotification(
                          notification
                        )
                      }
                      initial={{
                        opacity: 0,
                        x: -20,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index * 0.1,
                      }}
                      className={`bg-white/5 backdrop-blur rounded-2xl p-6 border cursor-pointer transition-all ${
                        selectedNotification?.id ===
                        notification.id
                          ? "border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10"
                          : !notification.is_read
                          ? "border-blue-500/50 bg-blue-500/5"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                notification.role
                              )}`}
                            >
                              {notification.role ||
                                t(
                                  "everyone"
                                )}
                            </span>

                            {!notification.is_read && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                                {t(
                                  "newLabel"
                                )}
                              </span>
                            )}
                          </div>

                          <p className="text-white/70 mb-3">
                          {translations[`noticeMessage_${notification.id}`] ||
                          notification.message}
                         </p>

                          <div className="flex items-center gap-4 text-white/40 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock
                                size={
                                  12
                                }
                              />

                              {new Date(
                                notification.date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleModifyNotification(
                                notification
                              );
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title={t(
                              "modifyNotice"
                            )}
                          >
                            <Pencil
                              size={
                                18
                              }
                            />
                          </button>

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleDeleteNotification(
                                notification.id
                              );
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title={t(
                              "deleteNotice"
                            )}
                          >
                            <Trash2
                              size={
                                18
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* EVENTS */}

        {activeTab === "events" && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <button
              onClick={() => {
                setEditingEvent(null);

                setNewEvent({
                  title: "",
                  type: "function",
                  date: "",
                  description: "",
                  location: "",
                });

                setShowEventModal(
                  true
                );
              }}
              className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus size={18} />

              {t("addNewEvent")}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(
                (event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.1,
                    }}
                    className={`bg-gradient-to-r ${getEventColor(
                      event.type
                    )} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-white/20 rounded-xl">
                            {getEventIcon(
                              event.type
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-white">
                            {
                              event.title
                            }
                          </h3>
                        </div>

                        <p className="text-white/80 text-sm mt-1">
                          {
                            event.description
                          }
                        </p>

                        <div className="flex items-center gap-4 mt-4 text-white/80 text-sm flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar
                              size={
                                14
                              }
                            />

                            {new Date(
                              event.date
                            ).toLocaleDateString()}
                          </span>

                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin
                                size={
                                  14
                                }
                              />

                              {
                                event.location
                              }
                            </span>
                          )}
                        </div>

                        <div className="mt-3">
                          <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium capitalize">
                            {
                              event.type
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            handleModifyEvent(
                              event
                            )
                          }
                          className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors"
                          title={t(
                            "modifyEvent"
                          )}
                        >
                          <Pencil
                            size={18}
                          />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteEvent(
                              event.id
                            )
                          }
                          className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors"
                          title={t(
                            "deleteEvent"
                          )}
                        >
                          <Trash2
                            size={18}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* NOTICE MODAL */}

      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
              }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-md border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingNotification
                    ? t(
                        "modifyNotice"
                      )
                    : t(
                        "addNotice"
                      )}
                </h2>

                <button
                  onClick={() => {
                    setShowNotificationModal(
                      false
                    );

                    setEditingNotification(
                      null
                    );

                    setValidationError(
                      ""
                    );
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
                  {
                    validationError
                  }
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={t(
                    "noticeTitle"
                  )}
                  value={
                    newNotification.title
                  }
                  onChange={(event) =>
                    setNewNotification({
                      ...newNotification,
                      title:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />

                <textarea
                  placeholder={t(
                    "noticeMessage"
                  )}
                  value={
                    newNotification.message
                  }
                  onChange={(event) =>
                    setNewNotification({
                      ...newNotification,
                      message:
                        event.target
                          .value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                />

                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    {t("sendTo")}
                  </label>

                  <div className="flex gap-3">
                    {[
                      {
                        id: "students",
                        label:
                          t(
                            "students"
                          ),
                        icon: Users,
                      },
                      {
                        id: "teachers",
                        label:
                          t(
                            "teachers"
                          ),
                        icon: User,
                      },
                      {
                        id: "all",
                        label:
                          t("all"),
                        icon: Mail,
                      },
                    ].map(
                      (option) => (
                        <button
                          key={
                            option.id
                          }
                          onClick={() =>
                            setSelectedRole(
                              option.id
                            )
                          }
                          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            selectedRole ===
                            option.id
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              : "bg-white/10 text-white/60 hover:bg-white/20"
                          }`}
                        >
                          <option.icon
                            size={
                              14
                            }
                          />

                          {
                            option.label
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={
                    handleSendNotification
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />

                  {editingNotification
                    ? t(
                        "updateNotice"
                      )
                    : t(
                        "addNotice"
                      )}
                </button>

                <button
                  onClick={() => {
                    setShowNotificationModal(
                      false
                    );

                    setEditingNotification(
                      null
                    );

                    setValidationError(
                      ""
                    );
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  {t("cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}