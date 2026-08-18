"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

import { useLanguage } from "../../context/LanguageContext";
import { othersTexts } from "./othersTexts";

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
  status?: string;
  is_read: boolean;
  applicable_class?: string | number;
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
  /* ---------------------------------------------------------------------- */
  /*                         LANGUAGE / TRANSLATION                         */
  /* ---------------------------------------------------------------------- */

  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  const t = (key: keyof typeof othersTexts) =>
    translations?.[key] || othersTexts[key];

  /* ---------------------------------------------------------------------- */
  /*                                STATES                                  */
  /* ---------------------------------------------------------------------- */

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [events, setEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<"notifications" | "events">(
      "notifications"
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedRole, setSelectedRole] =
    useState<string>("all");

  const [validationError, setValidationError] =
    useState("");

  /* Notification modal */

  const [
    showNotificationModal,
    setShowNotificationModal,
  ] = useState(false);

  const [
    editingNotification,
    setEditingNotification,
  ] = useState<Notification | null>(null);

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState<Notification | null>(null);

  /* Event modal */

  const [showEventModal, setShowEventModal] =
    useState(false);

  const [editingEvent, setEditingEvent] =
    useState<Event | null>(null);

  /* Voice */

  const [isRecording, setIsRecording] =
    useState(false);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  /* Notification form */

  const [newNotification, setNewNotification] =
    useState({
      title: "",
      message: "",
      date: "",
      applicable_class: "all",
    });

  /* Event form */

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

  /* ---------------------------------------------------------------------- */
  /*                         INITIAL LOAD                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    fetchData();

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

  /* ---------------------------------------------------------------------- */
  /*                         FETCH DATA                                     */
  /* ---------------------------------------------------------------------- */

  const fetchData = async () => {
    try {
      setLoading(true);

      /* ------------------------- Notifications ------------------------- */

      try {
        const noticesResponse =
          await fetch("/api/notices");

        const noticesData =
          await noticesResponse.json();

        console.log(
          "NOTICES API STATUS:",
          noticesResponse.status
        );

        console.log(
          "NOTICES API RESPONSE:",
          noticesData
        );

        if (noticesResponse.ok) {
          if (Array.isArray(noticesData)) {
            setNotifications(noticesData);
          } else if (
            Array.isArray(noticesData?.notices)
          ) {
            setNotifications(
              noticesData.notices
            );
          } else {
            setNotifications([]);
          }
        } else {
          console.error(
            "Failed to fetch notices:",
            noticesData
          );

          setNotifications([]);
        }
      } catch (error) {
        console.error(
          "Error fetching notices:",
          error
        );

        setNotifications([]);
      }

      /* ----------------------------- Events ----------------------------- */

      try {
        const eventsResponse =
          await fetch("/api/events");

        if (eventsResponse.ok) {
          const eventsData =
            await eventsResponse.json();

          if (Array.isArray(eventsData)) {
            setEvents(eventsData);
          } else if (
            Array.isArray(eventsData?.events)
          ) {
            setEvents(eventsData.events);
          } else {
            setEvents([]);
          }
        } else {
          console.error(
            "Events API returned:",
            eventsResponse.status
          );

          setEvents([]);
        }
      } catch (error) {
        console.error(
          "Error fetching events:",
          error
        );

        setEvents([]);
      }
    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );

      setNotifications([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         TRANSLATION                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    translateBulk(othersTexts);
  }, [language]);

  const getDynamicTexts = () => {
    const dynamicTexts: Record<
      string,
      string
    > = {};

    notifications.forEach(
      (notification) => {
        if (notification.title) {
          dynamicTexts[
            `noticeTitle_${notification.id}`
          ] = notification.title;
        }

        if (notification.message) {
          dynamicTexts[
            `noticeMessage_${notification.id}`
          ] = notification.message;
        }

        if (notification.role) {
          dynamicTexts[
            `noticeRole_${notification.id}`
          ] = notification.role;
        }
      }
    );

    events.forEach((event) => {
      if (event.title) {
        dynamicTexts[
          `eventTitle_${event.id}`
        ] = event.title;
      }

      if (event.description) {
        dynamicTexts[
          `eventDescription_${event.id}`
        ] = event.description;
      }

      if (event.location) {
        dynamicTexts[
          `eventLocation_${event.id}`
        ] = event.location;
      }

      if (event.type) {
        dynamicTexts[
          `eventType_${event.id}`
        ] = event.type;
      }
    });

    return dynamicTexts;
  };

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

    const dynamicTexts =
      getDynamicTexts();

    if (
      Object.keys(dynamicTexts).length > 0
    ) {
      translateBulk(dynamicTexts);
    }
  }, [
    language,
    notifications,
    events,
  ]);

  /* ---------------------------------------------------------------------- */
  /*                         VALIDATION                                     */
  /* ---------------------------------------------------------------------- */

  const validateNotice = () => {
    if (
      !newNotification.title.trim()
    ) {
      setValidationError(
        t("noticeTitleRequired")
      );

      return false;
    }

    if (
      !newNotification.message.trim()
    ) {
      setValidationError(
        t("noticeMessageRequired")
      );

      return false;
    }

    setValidationError("");

    return true;
  };

  /* ---------------------------------------------------------------------- */
  /*                         RESET NOTIFICATION                             */
  /* ---------------------------------------------------------------------- */

  const resetNotificationForm = () => {
    setNewNotification({
      title: "",
      message: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
      applicable_class: "all",
    });

    setSelectedRole("all");
    setEditingNotification(null);
    setValidationError("");
  };

  /* ---------------------------------------------------------------------- */
  /*                         ADD / MODIFY NOTIFICATION                     */
  /* ---------------------------------------------------------------------- */

  const handleSendNotification =
    async () => {
      if (!validateNotice()) {
        return;
      }

      try {
        const isEditing =
          !!editingNotification;

        const response = await fetch(
          isEditing
            ? `/api/notices?id=${editingNotification?.id}`
            : "/api/notices",
          {
            method: isEditing
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title:
                newNotification.title,
              message:
                newNotification.message,
              role: selectedRole,
              date:
                newNotification.date ||
                new Date()
                  .toISOString()
                  .split("T")[0],
              applicable_class:
                newNotification.applicable_class,
            }),
          }
        );

        if (response.ok) {
          await fetchData();

          setShowNotificationModal(
            false
          );

          resetNotificationForm();
        } else {
          let errorMessage =
            t("failedSendNotification");

          try {
            const errorData =
              await response.json();

            errorMessage =
              errorData?.error ||
              errorMessage;
          } catch {
            // Ignore JSON parsing error
          }

          setValidationError(
            errorMessage
          );
        }
      } catch (error) {
        console.error(
          "Error saving notification:",
          error
        );

        setValidationError(
          t("failedSendNotification")
        );
      }
    };

  /* ---------------------------------------------------------------------- */
  /*                         MODIFY NOTIFICATION                            */
  /* ---------------------------------------------------------------------- */

  const handleModifyNotification = (
    notification: Notification
  ) => {
    setEditingNotification(
      notification
    );

    setNewNotification({
      title:
        notification.title || "",
      message:
        notification.message || "",
      date:
        notification.date ||
        new Date()
          .toISOString()
          .split("T")[0],
      applicable_class:
        String(
          notification.applicable_class ||
            "all"
        ),
    });

    setSelectedRole(
      notification.role || "all"
    );

    setValidationError("");

    setShowNotificationModal(true);
  };

  /* ---------------------------------------------------------------------- */
  /*                         DELETE NOTIFICATION                            */
  /* ---------------------------------------------------------------------- */

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
        const response =
          await fetch(
            `/api/notices?id=${id}`,
            {
              method: "DELETE",
            }
          );

        if (response.ok) {
          await fetchData();

          if (
            selectedNotification?.id ===
            id
          ) {
            setSelectedNotification(
              null
            );
          }
        } else {
          console.error(
            "Failed to delete notification"
          );
        }
      } catch (error) {
        console.error(
          "Error deleting notice:",
          error
        );
      }
    };

  /* ---------------------------------------------------------------------- */
  /*                         EVENT HELPERS                                  */
  /* ---------------------------------------------------------------------- */

  const resetEventForm = () => {
    setNewEvent({
      title: "",
      type: "function",
      date: "",
      description: "",
      location: "",
    });

    setEditingEvent(null);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      setValidationError(
        t("eventTitleRequired")
      );

      return;
    }

    if (!newEvent.date) {
      setValidationError(
        t("eventDateRequired")
      );

      return;
    }

    const event: Event = {
      id:
        editingEvent?.id ||
        `E${Date.now()}`,
      ...newEvent,
    };

    if (editingEvent) {
      setEvents((current) =>
        current.map((item) =>
          item.id === editingEvent.id
            ? event
            : item
        )
      );
    } else {
      setEvents((current) => [
        ...current,
        event,
      ]);
    }

    setShowEventModal(false);
    resetEventForm();
    setValidationError("");
  };

  const handleModifyEvent = (
    event: Event
  ) => {
    setEditingEvent(event);

    setNewEvent({
      title: event.title,
      type: event.type,
      date: event.date,
      description:
        event.description,
      location:
        event.location || "",
    });

    setValidationError("");
    setShowEventModal(true);
  };

  const handleDeleteEvent = (
    id: string
  ) => {
    if (
      confirm(
        t(
          "deleteEventConfirmation"
        )
      )
    ) {
      setEvents((current) =>
        current.filter(
          (event) =>
            event.id !== id
        )
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         EVENT ICON                                     */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*                         EVENT COLOR                                    */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*                         ROLE COLOR                                     */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*                         VOICE TO TEXT                                  */
  /* ---------------------------------------------------------------------- */

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

        mediaRecorder.ondataavailable =
          (event: BlobEvent) => {
            if (
              event.data.size > 0
            ) {
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

              audioChunksRef.current =
                [];
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

  /* ---------------------------------------------------------------------- */
  /*                         TEXT TO VOICE                                  */
  /* ---------------------------------------------------------------------- */

  const handleTextToVoice =
    async () => {
      if (
        isPlaying &&
        audioRef.current
      ) {
        audioRef.current.pause();

        audioRef.current.currentTime =
          0;

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

  /* ---------------------------------------------------------------------- */
  /*                         FILTER                                         */
  /* ---------------------------------------------------------------------- */

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

  const filteredEvents =
    events.filter(
      (event) =>
        event.title
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||
        event.description
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||
        event.location
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

  /* ---------------------------------------------------------------------- */
  /*                              UI                                        */
  /* ---------------------------------------------------------------------- */

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

        {/* TABS + ADD */}

        <div className="flex flex-wrap gap-4 mb-6">

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

          <button
            onClick={() => {
              resetNotificationForm();
              setShowNotificationModal(
                true
              );
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={18} />

            {t("addNotice")}
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*                         NOTIFICATIONS                            */}
        {/* ---------------------------------------------------------------- */}

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

            {/* LISTEN BUTTON */}

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

            {/* NOTIFICATION TABLE */}

            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-white/10">

                    <tr>
                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("noticeTitle")}
                      </th>

                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("noticeMessage")}
                      </th>

                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("date")}
                      </th>

                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("sendTo")}
                      </th>

                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("status")}
                      </th>

                      <th className="px-4 py-3 text-left text-white text-sm font-medium">
                        {t("actions")}
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/5">

                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-white/60"
                        >
                          {t(
                            "loadingNotifications"
                          )}
                        </td>
                      </tr>
                    ) : filteredNotifications.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-white/60"
                        >
                          {searchTerm
                            ? "No items match your search"
                            : t(
                                "noNotifications"
                              )}
                        </td>
                      </tr>
                    ) : (
                      filteredNotifications.map(
                        (
                          notification,
                          index
                        ) => (
                          <motion.tr
                            key={
                              notification.id ||
                              index
                            }
                            onClick={() =>
                              setSelectedNotification(
                                notification
                              )
                            }
                            className={`cursor-pointer hover:bg-white/5 ${
                              selectedNotification?.id ===
                              notification.id
                                ? "bg-purple-500/10"
                                : ""
                            }`}
                          >

                            <td className="px-4 py-4 text-white text-sm font-medium">
                              {translations[
                                `noticeTitle_${notification.id}`
                              ] ||
                                notification.title ||
                                "-"}
                            </td>

                            <td className="px-4 py-4 text-white/80 text-sm max-w-md">
                              {translations[
                                `noticeMessage_${notification.id}`
                              ] ||
                                notification.message ||
                                "-"}
                            </td>

                            <td className="px-4 py-4 text-white/80 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />

                                {notification.date
                                  ? new Date(
                                      notification.date
                                    ).toLocaleDateString()
                                  : "-"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                  notification.role
                                )}`}
                              >
                                {translations[
                                  `noticeRole_${notification.id}`
                                ] ||
                                  notification.role ||
                                  t(
                                    "everyone"
                                  )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  notification.is_read
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {notification.is_read
                                  ? "Read"
                                  : "Active"}
                              </span>
                            </td>

                            <td className="px-4 py-4">

                              <div className="flex gap-2">

                                <button
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    handleModifyNotification(
                                      notification
                                    );
                                  }}
                                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                                  title={t(
                                    "modifyNotice"
                                  )}
                                >
                                  <Pencil
                                    size={16}
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
                                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                  title={t(
                                    "deleteNotice"
                                  )}
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>

                              </div>

                            </td>

                          </motion.tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/*                              EVENTS                              */}
        {/* ---------------------------------------------------------------- */}

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
                resetEventForm();
                setValidationError("");
                setShowEventModal(
                  true
                );
              }}
              className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus size={18} />

              {t("addNewEvent")}
            </button>

            {loading ? (
              <div className="text-center py-8 text-white/60">
                Loading...
              </div>
            ) : filteredEvents.length ===
              0 ? (
              <div className="text-center py-8 text-white/60">
                {searchTerm
                  ? "No events match your search"
                  : "No events found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {filteredEvents.map(
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
                              {translations[
                                `eventTitle_${event.id}`
                              ] ||
                                event.title}
                            </h3>

                          </div>

                          <p className="text-white/80 text-sm mt-1">
                            {translations[
                              `eventDescription_${event.id}`
                            ] ||
                              event.description}
                          </p>

                          <div className="flex items-center gap-4 mt-4 text-white/80 text-sm flex-wrap">

                            <span className="flex items-center gap-1">
                              <Calendar
                                size={14}
                              />

                              {event.date
                                ? new Date(
                                    event.date
                                  ).toLocaleDateString()
                                : "-"}
                            </span>

                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin
                                  size={14}
                                />

                                {translations[
                                  `eventLocation_${event.id}`
                                ] ||
                                  event.location}
                              </span>
                            )}

                          </div>

                          <div className="mt-3">

                            <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium capitalize">
                              {event.type}
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
            )}

          </motion.div>
        )}
      </div>

      {/*                         NOTIFICATION MODAL                        */}

      <AnimatePresence>

        {showNotificationModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowNotificationModal(
                false
              );
              resetNotificationForm();
            }}
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
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-lg border border-white/20"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="flex justify-between mb-6">

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

                    resetNotificationForm();
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

              </div>

              {/* VALIDATION ERROR */}

              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
                  {validationError}
                </div>
              )}

              <div className="space-y-4">

                {/* TITLE */}

                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    {t("noticeTitle")}
                  </label>

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
                </div>

                {/* MESSAGE */}

                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    {t("noticeMessage")}
                  </label>

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
                </div>

                {/* DATE */}

                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    {t("date")}
                  </label>

                  <input
                    type="date"
                    value={
                      newNotification.date
                    }
                    onChange={(event) =>
                      setNewNotification({
                        ...newNotification,
                        date:
                          event.target
                            .value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                {/* APPLICABLE CLASS */}

                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    Applicable Class
                  </label>

                  <select
                    value={
                      newNotification.applicable_class
                    }
                    onChange={(event) =>
                      setNewNotification({
                        ...newNotification,
                        applicable_class:
                          event.target
                            .value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option
                      value="all"
                      className="text-black"
                    >
                      All Classes
                    </option>

                    {[
                      1, 2, 3, 4, 5, 6,
                      7, 8, 9, 10, 11, 12,
                    ].map((num) => (
                      <option
                        key={num}
                        value={num}
                        className="text-black"
                      >
                        Class {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SEND TO */}

                <div>

                  <label className="text-white/60 text-sm mb-2 block">
                    {t("sendTo")}
                  </label>

                  <div className="flex gap-3">

                    {[
                      {
                        id: "students",
                        label:
                          t("students"),
                        icon: Users,
                      },
                      {
                        id: "teachers",
                        label:
                          t("teachers"),
                        icon: User,
                      },
                      {
                        id: "all",
                        label:
                          t("all"),
                        icon: Mail,
                      },
                    ].map((option) => {

                      const OptionIcon =
                        option.icon;

                      return (
                        <button
                          key={
                            option.id
                          }
                          type="button"
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
                          <OptionIcon
                            size={14}
                          />

                          {
                            option.label
                          }
                        </button>
                      );
                    })}

                  </div>
                </div>

              </div>

              {/* MODAL BUTTONS */}

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
                    : t("addNotice")}
                </button>

                <button
                  onClick={() => {
                    setShowNotificationModal(
                      false
                    );

                    resetNotificationForm();
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

      {/*                             EVENT MODAL                            */}

      <AnimatePresence>

        {showEventModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEventModal(false);
              resetEventForm();
              setValidationError("");
            }}
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
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-lg border border-white/20"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex justify-between mb-6">

                <h2 className="text-2xl font-bold text-white">
                  {editingEvent
                    ? t("modifyEvent")
                    : t("addNewEvent")}
                </h2>

                <button
                  onClick={() => {
                    setShowEventModal(
                      false
                    );

                    resetEventForm();
                    setValidationError(
                      ""
                    );
                  }}
                  className="text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>

              </div>

              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
                  {validationError}
                </div>
              )}

              <div className="space-y-4">

                {/* EVENT TITLE */}

                <input
                  type="text"
                  placeholder="Event title"
                  value={
                    newEvent.title
                  }
                  onChange={(event) =>
                    setNewEvent({
                      ...newEvent,
                      title:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />

                {/* EVENT TYPE */}

                <select
                  value={
                    newEvent.type
                  }
                  onChange={(event) =>
                    setNewEvent({
                      ...newEvent,
                      type: event.target
                        .value as
                        | "tour"
                        | "function"
                        | "activity",
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  <option
                    value="tour"
                    className="text-black"
                  >
                    Tour
                  </option>

                  <option
                    value="function"
                    className="text-black"
                  >
                    Function
                  </option>

                  <option
                    value="activity"
                    className="text-black"
                  >
                    Activity
                  </option>
                </select>

                {/* EVENT DATE */}

                <input
                  type="date"
                  value={
                    newEvent.date
                  }
                  onChange={(event) =>
                    setNewEvent({
                      ...newEvent,
                      date:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                />

                {/* DESCRIPTION */}

                <textarea
                  placeholder="Event description"
                  value={
                    newEvent.description
                  }
                  onChange={(event) =>
                    setNewEvent({
                      ...newEvent,
                      description:
                        event.target
                          .value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                />

                {/* LOCATION */}

                <input
                  type="text"
                  placeholder="Location"
                  value={
                    newEvent.location
                  }
                  onChange={(event) =>
                    setNewEvent({
                      ...newEvent,
                      location:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />

              </div>

              <div className="flex gap-3 mt-6">

                <button
                  onClick={
                    handleAddEvent
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingEvent
                    ? t(
                        "updateEvent"
                      )
                    : t("addNewEvent")}
                </button>

                <button
                  onClick={() => {
                    setShowEventModal(
                      false
                    );

                    resetEventForm();
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