"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  textToVoice,
  voiceToText,
} from "../../services/adminAIService";

import { studentTexts } from "./studentTexts";
import { useLanguage } from "../../context/LanguageContext";

import {
  Plus,
  Pencil,
  Trash2,
  Mic,
  Volume2,
  X,
  Users as UsersIcon,
  UserCheck,
  UserX,
  BookOpen,
} from "lucide-react";

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  rollNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  contact: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  status: "active" | "inactive";
}

type SearchType =
  | "name"
  | "id"
  | "class"
  | "section";

export default function StudentsPage() {
  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  const t = (key: keyof typeof studentTexts) =>
    translations?.[key] || studentTexts[key];

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [searchType, setSearchType] =
    useState<SearchType>("name");

  const [isRecording, setIsRecording] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [modalType, setModalType] =
    useState<"add" | "modify">("add");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [
    selectedStudentForVoice,
    setSelectedStudentForVoice,
  ] = useState<Student | null>(null);

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

  const [formData, setFormData] =
    useState({
      admissionNo: "",
      name: "",
      class: "",
      section: "",
      rollNo: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      contact: "",
      email: "",
      guardianName: "",
      guardianPhone: "",
    });

  /* -------------------------------------------------------------------------- */
  /*                          FETCH STUDENTS                                     */
  /* -------------------------------------------------------------------------- */

  const fetchStudents = async () => {
    setLoading(true);

    try {
      const response =
        await fetch("/api/students");

      const data = await response.json();

      console.log(
        "Students API Response:",
        data
      );

      if (data.success) {
        setStudents(
          Array.isArray(data.students)
            ? data.students
            : []
        );
      }
    } catch (error) {
      console.error(
        "Error fetching students:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                       INITIAL LOAD / CLEANUP                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    fetchStudents();

    return () => {
      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                       DYNAMIC STUDENT TEXTS                                 */
  /* -------------------------------------------------------------------------- */

  const getDynamicStudentTexts = () => {
    const dynamicTexts: Record<
      string,
      string
    > = {};

    students.forEach((student) => {
      if (student.name) {
        dynamicTexts[
          `studentName_${student.id}`
        ] = student.name;
      }

      if (student.parentName) {
        dynamicTexts[
          `parentName_${student.id}`
        ] = student.parentName;
      }

      if (student.guardianName) {
        dynamicTexts[
          `guardianName_${student.id}`
        ] = student.guardianName;
      }
    });

    return dynamicTexts;
  };

  /* -------------------------------------------------------------------------- */
  /*                       ONE BULK TRANSLATION CALL                             */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const dynamicTexts =
      getDynamicStudentTexts();

    const allTexts = {
      ...studentTexts,
      ...dynamicTexts,
    };

    translateBulk(allTexts);
  }, [language, students]);

  /* -------------------------------------------------------------------------- */
  /*                          VOICE TO TEXT                                      */
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

              const voiceFormData =
                new FormData();

              voiceFormData.append(
                "file",
                audioFile
              );

              voiceFormData.append(
                "language",
                "English"
              );

              voiceFormData.append(
                "user_email",
                "admin@sss.edu"
              );

              voiceFormData.append(
                "client_name",
                "SSS"
              );

              const response =
                await voiceToText(
                  voiceFormData
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
          t("allowMicrophone")
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                          TEXT TO VOICE                                      */
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

      if (!selectedStudentForVoice) {
        alert(
          t("selectStudentFirst")
        );

        return;
      }

      const student =
        selectedStudentForVoice;

      const text = [
        `Student name ${
          student.name ||
          "not available"
        }.`,
        `Admission number ${
          student.admissionNo ||
          "not available"
        }.`,
        `Class ${
          student.class ||
          "not assigned"
        }.`,
        `Section ${
          student.section ||
          "not assigned"
        }.`,
        `Roll number ${
          student.rollNo ||
          "not available"
        }.`,
        `Parent name ${
          student.parentName ||
          "not available"
        }.`,
        `Parent phone ${
          student.parentPhone ||
          "not available"
        }.`,
        `Student contact ${
          student.contact ||
          "not available"
        }.`,
        `Student email ${
          student.email ||
          "not available"
        }.`,
        `Status ${student.status}.`,
      ].join(" ");

      try {
        const response =
          await textToVoice({
            text,
            language: "English",
            user_email:
              "admin@sss.edu",
            client_name: "SSS",
          });

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
          "Student Text to Voice failed:",
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
  /*                              VALIDATION                                    */
  /* -------------------------------------------------------------------------- */

  const validateEmail = (
    email: string
  ): boolean => {
    if (!email) return true;

    return email
      .toLowerCase()
      .endsWith("@gmail.com");
  };

  /* -------------------------------------------------------------------------- */
  /*                               ADD STUDENT                                  */
  /* -------------------------------------------------------------------------- */

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      alert(
        t("fillStudentName")
      );

      return;
    }

    if (
      formData.email &&
      !validateEmail(
        formData.email
      )
    ) {
      alert(
        t("invalidStudentEmail")
      );

      return;
    }

    if (
      formData.parentEmail &&
      !validateEmail(
        formData.parentEmail
      )
    ) {
      alert(
        t("invalidParentEmail")
      );

      return;
    }

    try {
      const response =
        await fetch(
          "/api/students",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...formData,
              status: "active",
            }),
          }
        );

      const data =
        await response.json();

      if (data.success) {
        await fetchStudents();

        setIsModalOpen(false);

        resetForm();
      } else {
        alert(
          `Error: ${
            data.error || ""
          }`
        );
      }
    } catch (error) {
      console.error(
        "Error adding student:",
        error
      );

      alert(
        t("errorAddingStudent")
      );
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            MODIFY STUDENT                                  */
  /* -------------------------------------------------------------------------- */

  const handleModify =
    async () => {
      if (!selectedStudent) return;

      try {
        const response =
          await fetch(
            `/api/students/${selectedStudent.id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                formData
              ),
            }
          );

        const data =
          await response.json();

        if (data.success) {
          await fetchStudents();

          setIsModalOpen(false);

          resetForm();
        } else {
          alert(
            `Error: ${
              data.error || ""
            }`
          );
        }
      } catch (error) {
        console.error(
          "Error modifying student:",
          error
        );

        alert(
          t(
            "errorModifyingStudent"
          )
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                               DELETE                                       */
  /* -------------------------------------------------------------------------- */

  const handleDelete =
    async (id: string) => {
      if (
        !confirm(
          t("deleteConfirmation")
        )
      ) {
        return;
      }

      try {
        await fetch(
          `/api/students/${id}`,
          {
            method: "DELETE",
          }
        );

        await fetchStudents();
      } catch (error) {
        console.error(
          "Error deleting student:",
          error
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                              STATUS                                        */
  /* -------------------------------------------------------------------------- */

  const handleToggleStatus =
    async (id: string) => {
      const student =
        students.find(
          (item) =>
            item.id === id
        );

      if (!student) return;

      const newStatus =
        student.status === "active"
          ? "inactive"
          : "active";

      try {
        await fetch(
          `/api/students/${id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        await fetchStudents();
      } catch (error) {
        console.error(
          "Error toggling status:",
          error
        );
      }
    };

  /* -------------------------------------------------------------------------- */
  /*                              RESET                                         */
  /* -------------------------------------------------------------------------- */

  const resetForm = () => {
    setFormData({
      admissionNo: "",
      name: "",
      class: "",
      section: "",
      rollNo: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      contact: "",
      email: "",
      guardianName: "",
      guardianPhone: "",
    });

    setSelectedStudent(null);
  };

  /* -------------------------------------------------------------------------- */
  /*                               MODAL                                        */
  /* -------------------------------------------------------------------------- */

  const openModal = (
    type: "add" | "modify",
    student?: Student
  ) => {
    setModalType(type);

    if (
      type === "modify" &&
      student
    ) {
      setSelectedStudent(
        student
      );

      setFormData({
        admissionNo:
          student.admissionNo ||
          "",
        name: student.name || "",
        class: student.class || "",
        section:
          student.section || "",
        rollNo:
          student.rollNo || "",
        parentName:
          student.parentName ||
          "",
        parentPhone:
          student.parentPhone ||
          "",
        parentEmail:
          student.parentEmail ||
          "",
        contact:
          student.contact || "",
        email:
          student.email || "",
        guardianName:
          student.guardianName ||
          "",
        guardianPhone:
          student.guardianPhone ||
          "",
      });
    } else {
      resetForm();
    }

    setIsModalOpen(true);
  };

  /* -------------------------------------------------------------------------- */
  /*                                FILTER                                     */
  /* -------------------------------------------------------------------------- */

  const filteredStudents =
    students.filter(
      (student) => {
        const term =
          searchTerm.toLowerCase();

        if (
          searchType === "id"
        ) {
          return String(
            student.id
          ).includes(searchTerm);
        }

        if (
          searchType === "class"
        ) {
          return (
            student.class
              ?.toLowerCase() ||
            ""
          ).includes(term);
        }

        if (
          searchType === "section"
        ) {
          return (
            student.section
              ?.toLowerCase() ||
            ""
          ).includes(term);
        }

        return (
          student.name
            ?.toLowerCase() ||
          ""
        ).includes(term);
      }
    );

  /* -------------------------------------------------------------------------- */
  /*                                 STATS                                      */
  /* -------------------------------------------------------------------------- */

  const stats = [
    {
      label:
        t("totalStudents"),
      value: students.length,
      icon: UsersIcon,
      color:
        "from-blue-500 to-cyan-500",
    },
    {
      label:
        t("activeStudents"),
      value:
        students.filter(
          (student) =>
            student.status ===
            "active"
        ).length,
      icon: UserCheck,
      color:
        "from-green-500 to-emerald-500",
    },
    {
      label:
        t("inactiveStudents"),
      value:
        students.filter(
          (student) =>
            student.status ===
            "inactive"
        ).length,
      icon: UserX,
      color:
        "from-orange-500 to-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white/60">
          {t("loadingStudents")}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* TRANSLATION OVERLAY */}

      {translating &&
        language !== "English" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 text-white shadow-2xl">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              <span className="font-medium">
                {t("translating")}{" "}
                {language}...
              </span>
            </div>
          </div>
        )}

      {/* PAGE HEADER */}

      <motion.div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-400" />

          {t("pageTitle")}
        </h1>

        <p className="text-white/60">
          {t("pageSubtitle")}
        </p>
      </motion.div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map(
          (stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">
                    {stat.label}
                  </p>

                  <p className="text-white text-4xl font-bold mt-2">
                    {stat.value}
                  </p>
                </div>

                <stat.icon className="w-12 h-12 text-white/30" />
              </div>
            </div>
          )
        )}
      </div>

      {/* ACTION BUTTONS */}

      <div className="flex gap-4 mb-8">
        <button
          onClick={() =>
            openModal("add")
          }
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2"
        >
          <Plus size={20} />

          {t("addStudent")}
        </button>

        <button
          onClick={() => {
            if (
              filteredStudents.length ===
              1
            ) {
              openModal(
                "modify",
                filteredStudents[0]
              );

              return;
            }

            if (
              filteredStudents.length >
              0
            ) {
              const id =
                prompt(
                  t(
                    "enterStudentId"
                  )
                );

              if (!id) return;

              const student =
                students.find(
                  (item) =>
                    String(
                      item.id
                    ) === id
                );

              if (student) {
                openModal(
                  "modify",
                  student
                );
              } else {
                alert(
                  t(
                    "studentNotFound"
                  )
                );
              }

              return;
            }

            alert(
              t(
                "noStudentsAvailable"
              )
            );
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center gap-2"
        >
          <Pencil size={20} />

          {t("modifyStudent")}
        </button>
      </div>

      {/* SEARCH */}

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder={t(
              "search"
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
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full transition flex items-center justify-center ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Mic
              size={22}
              strokeWidth={2.3}
            />
          </button>
        </div>

        <select
          value={searchType}
          onChange={(event) =>
            setSearchType(
              event.target
                .value as SearchType
            )
          }
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
        >
          <option
            value="name"
            className="text-black"
          >
            {t("searchByName")}
          </option>

          <option
            value="id"
            className="text-black"
          >
            {t("searchById")}
          </option>

          <option
            value="class"
            className="text-black"
          >
            {t(
              "searchByClass"
            )}
          </option>

          <option
            value="section"
            className="text-black"
          >
            {t(
              "searchBySection"
            )}
          </option>
        </select>
      </div>

      {/* LISTEN */}

      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={
            handleTextToVoice
          }
          disabled={
            !selectedStudentForVoice &&
            !isPlaying
          }
          title={
            isPlaying
              ? t("stopAudio")
              : selectedStudentForVoice
              ? `${t(
                  "listenSelectedStudent"
                )}: ${
                  translations[
                    `studentName_${selectedStudentForVoice.id}`
                  ] ||
                  selectedStudentForVoice.name
                }`
              : t(
                  "selectStudentFirst"
                )
          }
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            isPlaying
              ? "bg-red-500 text-white hover:bg-red-600"
              : selectedStudentForVoice
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "cursor-not-allowed bg-white/10 text-white/40"
          }`}
        >
          <Volume2 size={20} />

          {isPlaying
            ? t("stop")
            : selectedStudentForVoice
            ? t(
                "listenSelectedStudent"
              )
            : t(
                "selectStudent"
              )}
        </button>
      </div>

      {/* TABLE */}

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[1600px]">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-4 text-left text-white">
                ID
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "admissionNo"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("name")}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("class")}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("section")}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("rollNo")}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "parentName"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "parentPhone"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "parentEmail"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "studentContact"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "studentEmail"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "guardianName"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t(
                  "guardianPhone"
                )}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("status")}
              </th>

              <th className="px-4 py-4 text-left text-white">
                {t("actions")}
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map(
              (student) => (
                <tr
                  key={student.id}
                  onClick={() =>
                    setSelectedStudentForVoice(
                      student
                    )
                  }
                  className={`cursor-pointer border-t transition ${
                    selectedStudentForVoice?.id ===
                    student.id
                      ? "border-purple-500 bg-purple-500/10 ring-1 ring-inset ring-purple-500/40"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <td className="px-4 py-4 text-white/80">
                    {student.id}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.admissionNo ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white font-medium">
                    {translations[
                      `studentName_${student.id}`
                    ] ||
                      student.name ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.class ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.section ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.rollNo ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {translations[
                      `parentName_${student.id}`
                    ] ||
                      student.parentName ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.parentPhone ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.parentEmail ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.contact ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.email ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {translations[
                      `guardianName_${student.id}`
                    ] ||
                      student.guardianName ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {student.guardianPhone ||
                      "—"}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        handleToggleStatus(
                          student.id
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        student.status ===
                        "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {student.status ===
                      "active"
                        ? t(
                            "active"
                          )
                        : t(
                            "inactive"
                          )}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          openModal(
                            "modify",
                            student
                          );
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                      >
                        <Pencil
                          size={
                            16
                          }
                        />
                      </button>

                      <button
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          handleDelete(
                            student.id
                          );
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2
                          size={
                            16
                          }
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {modalType ===
                  "add"
                    ? t(
                        "addNewStudent"
                      )
                    : t(
                        "modifyStudent"
                      )}
                </h2>

                <button
                  onClick={() =>
                    setIsModalOpen(
                      false
                    )
                  }
                >
                  <X
                    size={24}
                    className="text-white/40"
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t(
                    "admissionNumber"
                  )}
                  value={
                    formData.admissionNo
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      admissionNo:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "studentName"
                  )}
                  value={
                    formData.name
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "class"
                  )}
                  value={
                    formData.class
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      class:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "section"
                  )}
                  value={
                    formData.section
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      section:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "rollNumber"
                  )}
                  value={
                    formData.rollNo
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      rollNo:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "parentName"
                  )}
                  value={
                    formData.parentName
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      parentName:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="tel"
                  placeholder={t(
                    "parentPhone"
                  )}
                  value={
                    formData.parentPhone
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      parentPhone:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="email"
                  placeholder={t(
                    "parentEmailPlaceholder"
                  )}
                  value={
                    formData.parentEmail
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      parentEmail:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="tel"
                  placeholder={t(
                    "studentContact"
                  )}
                  value={
                    formData.contact
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      contact:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="email"
                  placeholder={t(
                    "studentEmailPlaceholder"
                  )}
                  value={
                    formData.email
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      email:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="text"
                  placeholder={t(
                    "guardianName"
                  )}
                  value={
                    formData.guardianName
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      guardianName:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />

                <input
                  type="tel"
                  placeholder={t(
                    "guardianPhone"
                  )}
                  value={
                    formData.guardianPhone
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      guardianPhone:
                        event.target
                          .value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={
                    modalType ===
                    "add"
                      ? handleAdd
                      : handleModify
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
                >
                  {modalType ===
                  "add"
                    ? t(
                        "addStudent"
                      )
                    : t(
                        "saveChanges"
                      )}
                </button>

                <button
                  onClick={() =>
                    setIsModalOpen(
                      false
                    )
                  }
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold"
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