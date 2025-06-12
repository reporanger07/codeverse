import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import FileSidebar from "../components/FileSidebar";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState("");

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room.`);
        }
        setClients(clients);
      });
      socketRef.current.on(ACTIONS.FILES_SYNC, ({ files, activeFile }) => {
        setFiles(files);
        setActiveFile(activeFile || Object.keys(files)[0] || "");
      });
      socketRef.current.on(ACTIONS.FILE_CHANGE, ({ fileName, newCode }) => {
        setFiles((prevFiles) => ({
          ...prevFiles,
          [fileName]: newCode,
        }));
      });
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ username, socketId }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.FILES_SYNC);
        socketRef.current.off(ACTIONS.FILE_CHANGE);
      }
    };
  }, []); // Note: leaving this empty as it appears to be the working configuration on your end.

  const handleFileSelect = (fileName) => setActiveFile(fileName);

  const handleNewFile = (fileName) => {
    if (files[fileName] !== undefined) {
      toast.error(`File "${fileName}" already exists.`);
      return;
    }
    socketRef.current.emit(ACTIONS.FILE_CREATE, { roomId, fileName });
  };

  const handleDeleteFile = (fileName) => {
    socketRef.current.emit(ACTIONS.FILE_DELETE, { roomId, fileName });
  };

  // ==================== NEW EVENT HANDLER FOR RENAMING ====================
  const handleFileRename = (oldFileName, newFileName) => {
    // Prevent renaming to a file that already exists
    if (files[newFileName] !== undefined) {
      toast.error(`A file named "${newFileName}" already exists.`);
      return;
    }
    socketRef.current.emit(ACTIONS.FILE_RENAME, {
      roomId,
      oldFileName,
      newFileName,
    });
  };
  // =======================================================================

  const handleCodeChange = (newCode) => {
    if (activeFile) {
      setFiles((prev) => ({ ...prev, [activeFile]: newCode }));
      socketRef.current.emit(ACTIONS.FILE_CHANGE, {
        roomId,
        fileName: activeFile,
        newCode,
      });
    }
  };

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <FileSidebar
            files={Object.keys(files)}
            onFileSelect={handleFileSelect}
            onNewFile={handleNewFile}
            onFileDelete={handleDeleteFile}
            onFileRename={handleFileRename} // <-- NEW PROP
            activeFile={activeFile}
          />
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          activeFile={activeFile}
          code={files[activeFile]}
          onCodeChange={handleCodeChange}
        />
      </div>
    </div>
  );
};

export default EditorPage;
