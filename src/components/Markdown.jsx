import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Renders a CMS markdown field. `className` is applied to each paragraph so
 * plain text looks exactly like the <p> it replaces. Renders nothing when
 * the field is empty.
 */
export function Markdown({ children, className }) {
  if (typeof children !== "string" || !children.trim()) return null;
  return (
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => <p className={className} {...props} />,
        a: ({ node, ...props }) => <a className="underline" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
