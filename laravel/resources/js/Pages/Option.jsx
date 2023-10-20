import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm } from "react-hook-form";
import axios from "axios";
import CodeResponseMessage from "@/Components/CodedResponseMessage";
import {
  faCheck,
  faTimes,
  faEdit,
  faTrashCan,
  faPlus,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { sortThreadsByDateCategory } from "@/common/lib";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";

const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const UserIcon = () => (
  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white">
    To
  </div>
);

export default function Option({ auth }) {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSidebarButtonHovered, setIsSidebarButtonHoverd] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [deleteThread, setDeleteThread] = useState(false);
  const [sortedThreads, setSortedThreads] = useState([]);
  const chatMessagesRef = useRef(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);
  const [editableMessageIndex, setEditableMessageIndex] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");

  const isNotBlank = (value) => {
    return value.trim().length > 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  const startNewThread = () => {
    const latestThread = threads[threads.length - 1];

    if (!latestThread || latestThread.title !== "") {
      const newThread = { id: Date.now(), messages: [], errors: [], title: "" };
      setCurrentThreadId(newThread.id);
      setThreads((prevThreads) => [...prevThreads, newThread]);
      reset();
    }
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
    reset();
    setEditedTitle(threads.find((thread) => thread.id === threadId)?.title);
    if (editingTitle && currentThreadId !== threadId) {
      setEditingTitle(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async () => {
    if (chatMessage === "" || isLoading) {
      return;
    }
    setIsLoading(true);
    const newThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          title: title.replace(/^\s+/, ""),
          content: chatMessage,
        });
        thread.chatMessage = "";
        thread.title = thread.title.replace(/^\s+/, "");
      }
      return thread;
    });
    setThreads(newThreads);
    await sendToOpenAI(
      newThreads.find((thread) => thread.id === currentThreadId).messages
    );
    setIsLoading(false);
  };

  const sendToOpenAI = async (threadMessages) => {
    const userMessage = threadMessages.map((msg) => {
      return {
        role: msg.role,
        content: msg.content + "",
      };
    });
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: userMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const botMessage = response.data.choices[0].message.content;

      setThreads((threads) =>
        threads.map((thread) => {
          if (thread.id === currentThreadId) {
            thread.messages.push({
              role: "assistant",
              content: JSON.stringify(botMessage),
            });
          }
          return thread;
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const persistErrorThread = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
  };

  const handleDeleteThread = (threadId) => {
    const threadIndex = threads.findIndex((thread) => thread.id === threadId);
    if (threadIndex !== -1) {
      setThreads((prevThreads) =>
        prevThreads.filter((thread) => thread.id !== threadId)
      );
      if (currentThreadId === threadId) {
        const nextThreadIndex = threadIndex === 0 ? 1 : threadIndex - 1;
        setCurrentThreadId(threads[nextThreadIndex]?.id || null);
      }
      setDeleteThread(false);
    }
  };

  const toggleEditTitle = () => {
    setEditedTitle(title);
    setEditingTitle(!editingTitle);
  };

  const handleEditTitleChange = (event) => {
    setEditedTitle(event.target.value);
  };

  const handleEditTitleConfirm = () => {
    const trimmedEditedTitle = editedTitle.replace(/^\s+/, "");
    if (editedTitle.trim() !== "") {
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                ...thread.draft,
                title: trimmedEditedTitle,
                messages: [
                  {
                    ...thread.messages[0],
                    title: (trimmedEditedTitle || "").slice(0, 30),
                  },
                  ...thread.messages.slice(1),
                ],
              }
            : thread
        )
      );
    }
    setEditingTitle(false);
  };

  const handleCopyClick = (index, e) => {
    e.preventDefault();
    const textToCopy = document.getElementById(`textToCopy_${index}`);

    if (textToCopy) {
      const range = document.createRange();
      range.selectNode(textToCopy);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();

      setSelectedResponseIndex(index);
      setShowCopiedMessage(true);

      setTimeout(() => {
        setShowCopiedMessage(false);
        setSelectedResponseIndex(null);
      }, 2500);
    }
  };

  const handleCancelEdit = (index) => {
    setEditableMessageIndex(null);
    setEditedMessage("");
  };
  
  const handleKeyDown = (e) => {
    persistErrorThread();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  useEffect(() => {
    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    setValue("title", title);
    setValue("chatMessage", chatMessage);
  }, [threads]);

  const chatMessage =
    threads.find((thread) => thread.id === currentThreadId)?.chatMessage || "";
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.title || "";
  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Option
        </h2>
      }
    >
      <Head title="Option" />

      <div className="flex h-full">
        {showSidebar && (
          <div className="w-80 min-h-screen pl-4 py-4 border-r">
            <button
              onClick={startNewThread}
              className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <div className="threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(100vh-6rem)]">
              {sortedThreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
                      const titleContent = (
                        thread.messages[0]?.title || ""
                      ).slice(0, 30);
                      return (
                        <div
                          key={thread.id}
                          onClick={() => selectThread(thread.id)}
                          className={`p-2 cursor-pointer border-b border-gray-200 relative ${
                            currentThreadId === thread.id
                              ? "bg-gray-200 rounded-l-sm"
                              : "hover:bg-[#edeff4]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              onClick={() => selectThread(thread.id)}
                              className={`font-bold cursor-pointer ${
                                currentThreadId === thread.id &&
                                thread.threadTitle
                                  ? "whitespace-nowrap"
                                  : "turncate"
                              }`}
                            >
                              Thread {thread.id}
                            </p>
                            {currentThreadId === thread.id &&
                              thread.messages.length > 0 && (
                                <>
                                  <div className="absolute right right-[40px] w-12 bg-gradient-to-r from-transparent to-gray-200" />
                                  <div className="absolute right-0 flex items-center gap-2 px-2 bg-gray-200">
                                    {editingTitle ? (
                                      <>
                                        <button
                                          className="text-gray-500 hover:text-green-700"
                                          onClick={handleEditTitleConfirm}
                                        >
                                          <FontAwesomeIcon
                                            className="md"
                                            icon={faCheck}
                                          />
                                        </button>
                                        <button
                                          className="text-gray-500 hover:text-red-700"
                                          onClick={() => {
                                            setEditingTitle(false);
                                            setEditedTitle(title);
                                          }}
                                        >
                                          <FontAwesomeIcon
                                            className="md"
                                            icon={faTimes}
                                          />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          className="ml-5 hover:text-blue-700 transition-colors duration-200"
                                          onClick={toggleEditTitle}
                                        >
                                          <FontAwesomeIcon
                                            size="sm"
                                            icon={faEdit}
                                          />
                                        </button>
                                        <button
                                          onClick={() => setDeleteThread(true)}
                                          className="hover:text-red-700 transition-colors duration-200"
                                        >
                                          <FontAwesomeIcon
                                            size="sm"
                                            icon={faTrashCan}
                                          />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                          </div>
                          {editingTitle && currentThreadId === thread.id ? (
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={handleEditTitleChange}
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                            />
                          ) : (
                            <p className="text-gray-500 truncate">
                              {titleContent}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        )}
        <Modal show={deleteThread} maxWidth="sm">
          <div className="text-gray-700 p-4 space-y-4">
            <h1 className="font-bold">Delete thread ?</h1>
            <hr />
            <p>
              This will delete{" "}
              <strong>
                {threads.find((thread) => thread.id === currentThreadId)?.title}
              </strong>
              .
            </p>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setDeleteThread(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={() => handleDeleteThread(currentThreadId)}>
                Delete
              </DangerButton>
            </div>
          </div>
        </Modal>

        <div className="flex flex-col w-full">
          <div className="overflow-auto p-4" ref={chatMessagesRef}>
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHoverd(false),
                    setEditingTitle(false);
                }}
                onMouseEnter={() => setIsSidebarButtonHoverd(true)}
                onMouseLeave={() => setIsSidebarButtonHoverd(false)}
                className="y-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon
                  icon={showSidebar ? faAngleLeft : faAngleRight}
                />
              </button>
              <div className="transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                {isSidebarButtonHovered && (
                  <>
                    <div className="absolute -right-4 top-4 h-2 w-2 bg-white shadow-md origin-center rotate-45" />
                    <div className="absolute -right-28 top-[6px] py-1 px-2 rounded-md bg-white shadow-md text-gray-500 text-sm font-medium">
                      {showSidebar ? "Close sidebar" : "Show sidebar"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {currentThreadId !== null && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  onKeyDown={handleKeyDown}
                >
                  <div className="flex mb-4">
                    <InputLabel
                      htmlFor="title"
                      className="pt-2 pr-2 whitespace-nowrap"
                      value="Title"
                    />
                    <div>
                      <TextInput
                        type="text"
                        className="ml-8 w-full sm:w-64 lg:w-96"
                        {...register("title", {
                          required: "*Please enter title",
                          validate: {
                            isNotBlank: (value) =>
                              isNotBlank(value) || "*Please enter title",
                          },
                        })}
                        name="title"
                        value={title}
                        onChange={handleChange}
                      />
                      {currentThread.errors?.title && (
                        <InputError
                          className="text-red-500 text-sm mt-1 ml-8"
                          message={currentThread.errors.title.message}
                        />
                      )}
                    </div>
                  </div>
                  {currentThread.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`my-2 p-2 ${
                        message.role === "user" ? "self-end" : "flex self-start"
                      }`}
                      onMouseEnter={() => setHoveredMessageIndex(index)}
                      onMouseLeave={() => setHoveredMessageIndex(null)}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center space-x-2">
                          <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                          <div className="p-2 rounded-md bg-gray-200 relative">
                            <button
                              className="absolute top-2 right-3"
                              onClick={(e) => handleCopyClick(index, e)}
                            >
                              {selectedResponseIndex === index &&
                              showCopiedMessage ? (
                                <FontAwesomeIcon icon={faCheck} />
                              ) : (
                                <FontAwesomeIcon icon={faCopy} />
                              )}
                            </button>
                            <div id={`textToCopy_${index}`}>
                              <p>{message.content.replace(/\n/g, "")}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {message.role === "user" && (
                        <div
                          className="flex items-center space-x-2"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <UserIcon />
                          <div
                            className={`p-2 pr-9 rounded-md border border-gray-300 relative ${
                              hoveredMessageIndex === index ? "hovered" : ""
                            }`}
                          >
                            {hoveredMessageIndex === index && (
                              <button
                                className="absolute top-2 right-0 text-gray-500 hover:text-gray-700"
                                onClick={() => setEditableMessageIndex(index)}
                              >
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  className="hovered-icon"
                                />
                              </button>
                            )}
                            <div>
                              {editableMessageIndex === index ? (
                                <div>
                                  <textarea
                                    value={message.content}
                                    onChange={(e) =>
                                      handleEditMessageChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <div>
                                    <button className="bg-green-900 text-sky-100 mr-2 w-32 rounded-lg">
                                      Submit
                                    </button>
                                    <button
                                      className="bg-red-800 text-sky-100 w-32 rounded-lg"
                                      onClick={() => handleCancelEdit(index)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>{message.content}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {currentThreadId && (
                    <div className="border-t p-4">
                      <div className="flex items-center">
                        <div className="flex flex-col flex-grow">
                          <textarea
                            className="flex-grow mr-2 p-2 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...register("chatMessage", {
                              required: "*Please enter message",
                              validate: {
                                isNotBlank: (value) =>
                                  isNotBlank(value) || "*Please enter message",
                              },
                            })}
                            name="chatMessage"
                            value={chatMessage}
                            onChange={handleChange}
                          />
                          {currentThread.errors?.chatMessage && (
                            <InputError
                              className="text-red-500 text-sm mt-1"
                              message={currentThread.errors.chatMessage.message}
                            />
                          )}
                        </div>
                        <button
                          onClick={persistErrorThread}
                          type="submit"
                          className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
                        >
                          {isLoading ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="animate-spin"
                            />
                          ) : (
                            <FontAwesomeIcon icon={faPaperPlane} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
