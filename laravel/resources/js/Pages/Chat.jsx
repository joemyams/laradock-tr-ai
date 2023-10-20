import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm } from "react-hook-form";
import {
  faPlus,
  faMessage,
  faCheck,
  faTimes,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
  faTrashCan,
  faEdit,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import CodeResponseMessage from "@/Components/CodedResponseMessage";
import { sortThreadsByDateCategory } from "@/common/lib";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";

const CURL = "https://api.openai.com/v1/completions";
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const UserIcon = () => (
  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white">
    To
  </div>
);

export default function Chat({ auth }) {
  const [aiErrRes, SetAiErrRes] = useState("");
  const [threads, setThreads] = useState([]);
  const [isSidebarButtonHovered, setIsSidebarButtonHovered] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editInput, setEditInput] = useState(false);
  const [updateTitles, setUpdateTitles] = useState("");
  const [sortedthreads, setSortedThreads] = useState([]);
  const [count, setCount] = useState(0);
  const [deleteThread, setDeleteThread] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [isEditMessage, setIsEditMessage] = useState(false);
  const [editedUserMessage, setEditedUserMessage] = useState("");
  const [editedMessageIndex, setEditedMessageIndex] = useState(null);
  const [addThreads, setAddThreads] = useState(false);
  const chatMessagesRef = useRef(null);
  const textAreaRef = useRef(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const draftMessage =
    threads.find((thread) => thread.id === currentThreadId)?.draftMessage || "";

  const scrollContainer = {
    maxHeight: "calc(100vh - 8rem)",
    overflowY: "auto",
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const startNewThread = () => {
    if (!addThreads) {
      const newThread = {
        id: Date.now(),
        title: "",
        messages: [],
        draftMessage: "",
      };
      setThreads((prevThreads) => [...prevThreads, newThread]);
      setCurrentThreadId(newThread.id);
      setCount(0);
      setIsEditMessage(false);
      setEditedMessageIndex(null);
      setAddThreads(true);
      reset();
    }
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

  const selectThread = (threadId) => {
    reset();
    setIsEditMessage(false);
    setEditedMessageIndex(null);
    setCurrentThreadId(threadId);
  };

  const handleSaveTitleUpdate = (threadId) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === threadId ? { ...thread, title: updateTitles } : thread
      )
    );
    setEditInput(false);
  };

  const showEditMessage = (indexId, value) => {
    !isEditMessage
      ? (setEditMessage(
          <button
            type="button"
            className="mr-8 items-end text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={() => {
              setIsEditMessage(true);
              setEditedMessageIndex(indexId);
              setEditedUserMessage(value);
            }}
          >
            <FontAwesomeIcon size="sm" icon={faEdit} />
          </button>
        ),
        setEditedMessageIndex(indexId))
      : null;
  };

  const hideEditMessage = () => {
    setEditMessage("");
  };

  const handleSaveEditedMessage = async () => {
    setIsLoading(true);
    const updatedThreads = [...threads];
    const currentThread = updatedThreads.find(
      (thread) => thread.id === currentThreadId
    );
    if (currentThread) {
      const updatedMessages = [];
      let deletedSubsequentMessages = false;

      for (let index = 0; index < currentThread.messages.length; index++) {
        if (editedMessageIndex === index) {
          updatedMessages.push({ role: "user", content: editedUserMessage });
          deletedSubsequentMessages = true;
        } else if (!deletedSubsequentMessages) {
          updatedMessages.push(currentThread.messages[index]);
        }
      }
      currentThread.messages = updatedMessages.filter(
        (message) => message !== null
      );
    }
    setThreads(updatedThreads);
    setEditedUserMessage("");
    setEditedMessageIndex(null);
    setIsEditMessage(false);
    await sendToOpenAI(currentThread.messages);
    setIsLoading(false);
  };

  const isNotBlank = (message) => (value) => {
    if (!value.trim()) {
      return message;
    }
    return undefined;
  };

  const persistErrrorThread = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
  };

  const sendMessage = async () => {
    if (draftMessage === "" || isLoading) {
      return;
    }
    setIsLoading(true);
    const newThreads = threads.map((thread) => {
      thread.id === currentThreadId
        ? setAddThreads(false)
        : setAddThreads(true);
      if (thread.id === currentThreadId) {
        thread.messages.push({ role: "user", content: draftMessage });
        thread.draftMessage = "";
      }
      return thread;
    });
    setThreads(newThreads);
    await sendToOpenAI(
      newThreads.find((thread) => thread.id === currentThreadId).messages
    );
    setIsLoading(false);
  };

  function detectCode(message) {
    const codeSnippetRegex = /```[\s\S]*?```/g;
    return codeSnippetRegex.test(message);
  }

  const codeResponse = (message) => {
    const botMessage = message
      .split(/(```[\s\S]*?```)/g)
      .map((content) =>
        detectCode(content) ? handleGenerateSnip(content) : content
      );
    return botMessage;
  };

  const handleGenerateSnip = (message) => {
    const codeSnippetRegex = /```([^\s]+)\s*([\s\S]*?)```/g;
    let match;
    let newSnippet = {};
    while ((match = codeSnippetRegex.exec(message)) !== null) {
      const language = match[1];
      const code = match[2];
      newSnippet = { language, code };
    }
    return newSnippet;
  };

  const sendToOpenAI = async (threadMessages) => {
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: threadMessages,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const botMessage = response.data.choices[0].message.content;
      const detectCodeSnip = detectCode(botMessage)
        ? codeResponse(botMessage)
        : botMessage;

      setThreads((threads) =>
        threads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    role: "assistant",
                    content: JSON.stringify(detectCodeSnip),
                  },
                ],
              }
            : thread
        )
      );

      if (count < 1) {
        await generateTitle(detectCodeSnip, currentThreadId);
      }
    } catch (error) {
      console.error(error);
      SetAiErrRes(error.response.data.error.message);
    }
  };

  const generateTitle = async (threadContent, threadId) => {
    if (!threadId) return;

    setCount(count + 1);

    if (count < 1) {
      try {
        const response = await axios.post(
          CURL,
          {
            model: "text-davinci-003",
            prompt: `Generate a label for the content: ${threadContent}`,
            max_tokens: 7,
            temperature: 0,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );

        const title = response.data.choices[0].text;
        setThreads((threads) =>
          threads.map((thread) =>
            thread.id === currentThreadId ? { ...thread, title: title } : thread
          )
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleKeyPress = (e) => {
    persistErrrorThread();
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(sendMessage)();
    }
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
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

  useEffect(() => {
    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
    setUpdateTitles(
      threads.find((thread) => thread.id === currentThreadId)?.title || ""
    );
    setEditInput(false);
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    setValue("draftMessage", draftMessage);
  }, [threads, currentThreadId]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
    setValue("draftMessage", draftMessage);
  }, [draftMessage, editedUserMessage, draftMessage]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Chat
        </h2>
      }
    >
      <Head title="Chat" />

      <div className="flex ...">
        {showSidebar && (
          <div className="shrink-0 w-full lg:w-72 md:w-60 min-h-screen pl-4 py-4 border-r">
            <div className="flex items-start">
              <button
                onClick={startNewThread}
                className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                className="lg:hidden md:hidden ml-60 px-4 rounded bg-gray-500 hover:bg-gray-700 text-white"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </button>
            </div>
            <div className="mt-4 threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(80vh-6rem)]">
              {sortedthreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
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
                                currentThreadId === thread.id && thread.title
                                  ? "whitespace-nowrap"
                                  : "truncate"
                              }`}
                            >
                              Thread {thread.id}
                            </p>
                            {thread.title && currentThreadId === thread.id && (
                              <>
                                <div className="absolute right-[40px] w-12 h-4 bg-gradient-to-r from-transparent to-gray-200" />
                                <div className="absolute right-0 flex items-center gap-2 px-2 bg-gray-200 mr-6">
                                  {editInput ? (
                                    <>
                                      <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() =>
                                          handleSaveTitleUpdate(
                                            thread.id,
                                            updateTitles
                                          )
                                        }
                                      >
                                        <FontAwesomeIcon
                                          className="md"
                                          icon={faCheck}
                                        />
                                      </button>
                                      <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => {
                                          setEditInput(false);
                                          setUpdateTitles(thread.title);
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
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => {
                                          setEditInput(true);
                                          setUpdateTitles(thread.title);
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          size="sm"
                                          icon={faEdit}
                                        />
                                      </button>
                                      <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => setDeleteThread(true)}
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
                          {editInput && currentThreadId === thread.id ? (
                            <input
                              type="text"
                              value={updateTitles}
                              onChange={(e) => setUpdateTitles(e.target.value)}
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                            />
                          ) : (
                            <div className="text-gray-500 truncate">
                              <FontAwesomeIcon icon={faMessage} />
                              {thread.title}
                            </div>
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
            <h1 className="mt-2 text-lg font-bold">Delete thread?</h1>
            <hr />
            <p>
              this will delete{" "}
              <strong>
                {threads.find((thread) => thread.id === currentThreadId)?.title}
                .
              </strong>
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

        <div className="flex-1 min-h-screen">
          <div style={scrollContainer} className="p-4" ref={chatMessagesRef}>
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHovered(false);
                }}
                onMouseEnter={() => setIsSidebarButtonHovered(true)}
                onMouseLeave={() => setIsSidebarButtonHovered(false)}
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
                  onKeyDown={handleKeyPress}
                  onSubmit={handleSubmit(sendMessage)}
                >
                  <>
                    {threads
                      .find((thread) => thread.id === currentThreadId)
                      .messages.map((message, index) => (
                        <div
                          key={index}
                          className={`my-2 p-2 ${
                            message.role === "user"
                              ? "self-end"
                              : "flex self-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex items-center space-x-2">
                              <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                              <div className="p-2 rounded-md bg-gray-200 relative">
                                <button
                                  className="absolute top-0 right-2"
                                  onClick={(e) => handleCopyClick(index, e)}
                                >
                                  {selectedResponseIndex === index &&
                                  showCopiedMessage ? (
                                    <FontAwesomeIcon icon={faCheck} />
                                  ) : (
                                    <FontAwesomeIcon icon={faCopy} />
                                  )}
                                </button>
                                <div
                                  className="p-2 rounded-md whitespace-pre-wrap"
                                  id={`textToCopy_${index}`}
                                >
                                  {Array.isArray(
                                    JSON.parse(message.content)
                                  ) ? (
                                    <CodeResponseMessage
                                      content={message.content}
                                    />
                                  ) : (
                                    <pre className="whitespace-pre-wrap">
                                      {JSON.parse(message.content)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {message.role === "user" && (
                            <div className="flex items-center space-y-2">
                              <UserIcon className="block h-9 w-auto fill-current text-gray-800" />
                              <div className="p-2 ml-2 flex-grow rounded-md border border-gray-300">
                                <div
                                  onMouseMoveCapture={() =>
                                    showEditMessage(index, message.content)
                                  }
                                  onMouseLeave={hideEditMessage}
                                  className="flex flex-warp"
                                >
                                  <div className="flex-initial w-full place-self-center">
                                    {isEditMessage &&
                                    editedMessageIndex === index ? (
                                      <textarea
                                        ref={textAreaRef}
                                        value={editedUserMessage}
                                        onChange={(e) =>
                                          setEditedUserMessage(e.target.value)
                                        }
                                        className="whitespace-pre-wrap w-full border-none focus:outline-none focus:ring-0 bg-gray-100 overflow-hidden resize-none"
                                      />
                                    ) : (
                                      <pre className="whitespace-pre-wrap p-2">
                                        {message.content}
                                      </pre>
                                    )}
                                  </div>
                                  <div className="flex-initial w-20">
                                    {!isEditMessage &&
                                    editedMessageIndex === index
                                      ? editMessage
                                      : null}
                                  </div>
                                </div>
                                <div className="grid grid-cols-6...">
                                  {isEditMessage &&
                                  editedMessageIndex === index ? (
                                    <div className="place-self-center">
                                      <button
                                        type="button"
                                        onClick={handleSaveEditedMessage}
                                        className="text-sm p-2 text-white rounded bg-green-500 hover:bg-green-700"
                                      >
                                        Save & Submit
                                      </button>
                                      <button
                                        onClick={() => setIsEditMessage(false)}
                                        type="button"
                                        className="ml-2 text-sm p-2 text-white rounded bg-gray-500 hover:bg-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                          <InputError message={aiErrRes} />
                        </div>
                      ))}
                  </>

                  {currentThreadId && (
                    <div className="border-t p-2">
                      <div className="flex items-center">
                        <div className="w-full">
                          <InputLabel
                            htmlFor="draftMessage"
                            className="text-gray-600"
                          />
                          <textarea
                            id="draftMessage"
                            name="draftMessage"
                            {...register("draftMessage", {
                              required: "*Message is required!",
                              validate: isNotBlank(
                                "*blank space are not allowed."
                              ),
                            })}
                            value={draftMessage}
                            onChange={handleMessageChange}
                            className="w-full flex-grow mr-2 p-2 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={persistErrrorThread}
                          type="submit"
                          className="mb-1 ml-2 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
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
                      {threads.find((thread) => thread.id === currentThreadId)
                        ?.errors?.draftMessage && (
                        <InputError
                          className="text-sm"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors.draftMessage.message
                          }
                        />
                      )}
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
