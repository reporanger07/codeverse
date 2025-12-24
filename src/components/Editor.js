import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";

import "codemirror/mode/javascript/javascript";
import "codemirror/mode/xml/xml";
import "codemirror/mode/css/css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

const Editor = ({ activeFile, code, onCodeChange }) => {
  const editorRef = useRef(null);
  const textAreaRef = useRef(null);
  // This ref will be a stable container for our onChange handler
  const onCodeChangeRef = useRef(onCodeChange);

  // This effect ensures our ref always holds the LATEST onCodeChange function
  // from the parent component, but it doesn't cause re-renders.
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // This effect initializes the editor only ONCE
  useEffect(() => {
    if (textAreaRef.current && !editorRef.current) {
      const editor = Codemirror.fromTextArea(textAreaRef.current, {
        theme: "material-darker",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      });
      editorRef.current = editor;

      // CRITICAL FIX: The event handler now calls the function from the ref.
      // The ref *always* has the latest function, so this never becomes stale.
      editor.on("change", (instance, changes) => {
        if (changes.origin !== "setValue") {
          onCodeChangeRef.current(instance.getValue());
        }
      });
    }
  }, []); // Runs only on first mount

  // This effect correctly handles UPDATES when you switch files
  useEffect(() => {
    if (editorRef.current) {
      // Update content
      const currentCode = editorRef.current.getValue();
      const newCode = code || "";
      if (newCode !== currentCode) {
        editorRef.current.setValue(newCode);
      }

      // Update language mode
      const extension = activeFile ? activeFile.split(".").pop() : "js";
      let mode = "javascript";
      if (extension === "css") mode = "css";
      if (extension === "html" || extension === "xml") mode = "xml";

      if (editorRef.current.getOption("mode") !== mode) {
        editorRef.current.setOption("mode", mode);
      }
    }
  }, [code, activeFile]); // Runs when code or activeFile changes

  return <textarea ref={textAreaRef} />;
};

export default Editor;
