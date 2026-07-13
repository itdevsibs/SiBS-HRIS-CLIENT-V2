import React, { useMemo } from "react";

import RichTextViewer from "../../../../modals/jobDescription/RichTextViewer";
import {
  getChildPrefix,
  getChildText,
  hasVisibleRichText,
  isHtmlContent,
  parseDetailContent,
} from "../../../../../lib/utils/jobDescription/documentText";
import {
  getCommentStableKey,
  getCommentUniqueKey,
  getCommentsForTextUnit,
  getFirstMatchedUnitKey,
  getInlineCommentMatches,
  getLastMatchedUnitKey,
  getUnmatchedRevisionComments,
} from "../../../../../lib/utils/jobDescription/revisionComments";

function HighlightedRevisionText({ value = "" }) {
  const blocks = useMemo(
    () => parseDetailContent(value),
    [value],
  );

  if (!String(value || "").trim()) return null;

  return (
    <div className="jd-single-spaced-justified space-y-1 text-justify text-sm font-semibold leading-[1.5] text-amber-800">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";

          const listClassName = block.ordered
            ? "list-decimal space-y-1 pl-5 text-justify leading-[1.5]"
            : "list-disc space-y-1 pl-5 text-justify leading-[1.5]";

          return (
            <ListTag
              key={`highlight-list-${index}`}
              className={listClassName}
            >
              {block.items.map(
                (listItem, listIndex) => (
                  <li
                    key={`highlight-item-${listIndex}`}
                    value={
                      block.ordered &&
                      Number.isFinite(listItem.number)
                        ? listItem.number
                        : undefined
                    }
                  >
                    {listItem.text}

                    {listItem.children?.length > 0 && (
                      <div className="mt-1 space-y-1 pl-5 text-justify leading-[1.5]">
                        {listItem.children.map(
                          (child, childIndex) => (
                            <div
                              key={`highlight-child-${listIndex}-${childIndex}`}
                              className="flex gap-2 text-justify leading-[1.5]"
                            >
                              {getChildPrefix(child) && (
                                <span className="shrink-0">
                                  {getChildPrefix(child)}
                                </span>
                              )}

                              <span>
                                {getChildText(child)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </li>
                ),
              )}
            </ListTag>
          );
        }

        return (
          <p key={`highlight-paragraph-${index}`}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function InlineCommentedText({
  text = "",
  comments = [],
  className = "",
  approvalPage = false,
  boundaryMap = {},
}) {
  const matches = getInlineCommentMatches(text, comments);

  if (!matches.length) {
    return (
      <span
        className={`${className} ${
          approvalPage ? "selection:bg-[#FFF3B8] selection:text-[#101828]" : ""
        }`}
      >
        {text}
      </span>
    );
  }

  const nodes = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(
        <span key={`text-before-${index}`}>
          {text.slice(cursor, match.start)}
        </span>,
      );
    }

    const commentKey = getCommentStableKey(match.comment);
    const boundary = boundaryMap[commentKey] || {};
    const isStart = Boolean(boundary.start);
    const isEnd = Boolean(boundary.end);

    nodes.push(
      <React.Fragment key={`highlight-fragment-${commentKey}-${match.start}`}>
        <span className="inline-flex items-center gap-1 align-middle">
          {isStart && (
            <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
              &gt;&gt;&gt;
            </span>
          )}

          <span
            className="inline-flex items-center self-center rounded-md bg-[#FFF3B8] px-1.5 py-0.5 font-semibold leading-normal text-[#101828] ring-1 ring-amber-300"
            title={match.comment.comment || "Marked for revision"}
          >
            {text.slice(match.start, match.end)}
          </span>

          {isEnd && (
            <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
              &lt;&lt;&lt;
            </span>
          )}
        </span>
      </React.Fragment>,
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="text-after">{text.slice(cursor)}</span>);
  }

  return (
    <span
      className={`${className} ${
        approvalPage ? "selection:bg-[#FFF3B8] selection:text-[#101828]" : ""
      }`}
    >
      {nodes}
    </span>
  );
}

function DetailContentRenderer({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
  comments = [],
}) {
  const blocks = useMemo(
    () => parseDetailContent(value),
    [value],
  );

  if (!hasVisibleRichText(value)) {
    return (
      <p className="text-sm text-sibs-tertiary-5">
        {emptyText}
      </p>
    );
  }

  const hasSelectedTextComments = comments.some(
    (comment) =>
      String(
        comment?.selectedText ||
          comment?.selected_text ||
          "",
      ).trim(),
  );

  /*
   * General Details view and normal approval sections render the saved HTML
   * directly. This prevents tags such as <p>, <ul>, and <li> from appearing as
   * text and preserves formatting created by the Tiptap editor.
   *
   * The legacy text renderer remains available only when selected-text
   * revision comments must be positioned inline.
   */
  if (
    isHtmlContent(value) &&
    (!approvalPage || !hasSelectedTextComments)
  ) {
    return (
      <RichTextViewer
        value={value}
        className="jd-single-spaced-justified text-justify text-[#344054]"
        emptyText={emptyText}
      />
    );
  }

  const selectionClass = approvalPage
    ? "selection:bg-[#FFF3B8] selection:text-[#101828]"
    : "selection:bg-transparent selection:text-inherit";

  return (
    <div className={`jd-single-spaced-justified min-w-0 space-y-2 text-justify ${selectionClass}`}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClassName = block.ordered
            ? "list-decimal space-y-1 pl-5 text-justify text-sm font-medium leading-[1.5] text-[#344054] sm:pl-6 sm:text-[15px]"
            : "list-disc space-y-1 pl-5 text-justify text-sm font-medium leading-[1.5] text-[#344054] sm:pl-6 sm:text-[15px]";

          return (
            <ListTag key={`list-${index}`} className={listClassName}>
              {block.items.map((listItem, listIndex) => {
                const itemUnitKey = `item-${listIndex}`;
                const itemComments = getCommentsForTextUnit(
                  listItem.text,
                  comments,
                );

                const itemCommentsToDisplay = itemComments.filter(
                  (comment) =>
                    getLastMatchedUnitKey(block, comment) === itemUnitKey,
                );

                return (
                  <li
                    key={`item-${listIndex}`}
                    value={
                      block.ordered &&
                      Number.isFinite(listItem.number)
                        ? listItem.number
                        : undefined
                    }
                    className="text-justify leading-[1.5]"
                  >
                    <InlineCommentedText
                      text={listItem.text}
                      comments={comments}
                      approvalPage={approvalPage}
                      boundaryMap={Object.fromEntries(
                        itemComments.map((comment) => {
                          const commentKey = getCommentStableKey(comment);

                          return [
                            commentKey,
                            {
                              start:
                                getFirstMatchedUnitKey(block, comment) ===
                                itemUnitKey,
                              end:
                                getLastMatchedUnitKey(block, comment) ===
                                itemUnitKey,
                            },
                          ];
                        }),
                      )}
                    />

                    {itemCommentsToDisplay.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {itemCommentsToDisplay.map((comment) => (
                          <InlineRevisionCommentBlock
                            key={
                              comment.id || `${listIndex}-${comment.comment}`
                            }
                            comment={comment}
                            showSelectedContent={false}
                          />
                        ))}
                      </div>
                    )}

                    {listItem.children?.length > 0 && (
                      <ol className="mt-1 space-y-1 pl-6 text-justify leading-[1.5]">
                        {listItem.children.map((child, childIndex) => {
                          const childText = getChildText(child);
                          const childPrefix = getChildPrefix(child);
                          const childUnitKey = `child-${listIndex}-${childIndex}`;

                          const childComments = getCommentsForTextUnit(
                            childText,
                            comments,
                          );

                          const childCommentsToDisplay = childComments.filter(
                            (comment) =>
                              getLastMatchedUnitKey(block, comment) ===
                              childUnitKey,
                          );

                          return (
                            <li
                              key={`child-${listIndex}-${childIndex}`}
                              className="list-none text-justify leading-[1.5]"
                            >
                              <div className="flex gap-2 text-justify leading-[1.5]">
                                {childPrefix && (
                                  <span className="shrink-0 font-semibold text-[#344054]">
                                    {childPrefix}
                                  </span>
                                )}

                                <div className="min-w-0 flex-1">
                                  <InlineCommentedText
                                    text={childText}
                                    comments={comments}
                                    approvalPage={approvalPage}
                                    boundaryMap={Object.fromEntries(
                                      childComments.map((comment) => {
                                        const commentKey =
                                          getCommentStableKey(comment);

                                        return [
                                          commentKey,
                                          {
                                            start:
                                              getFirstMatchedUnitKey(
                                                block,
                                                comment,
                                              ) === childUnitKey,
                                            end:
                                              getLastMatchedUnitKey(
                                                block,
                                                comment,
                                              ) === childUnitKey,
                                          },
                                        ];
                                      }),
                                    )}
                                  />

                                  {childCommentsToDisplay.length > 0 && (
                                    <div className="mt-3 space-y-3">
                                      {childCommentsToDisplay.map((comment) => (
                                        <InlineRevisionCommentBlock
                                          key={
                                            comment.id ||
                                            `${childIndex}-${comment.comment}`
                                          }
                                          comment={comment}
                                          showSelectedContent={false}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ListTag>
          );
        }

        const paragraphComments = getCommentsForTextUnit(block.text, comments);

        return (
          <div key={`paragraph-wrap-${index}`}>
            <p className="text-justify text-sm font-medium leading-[1.5] text-[#344054] sm:text-[15px]">
              <InlineCommentedText
                text={block.text}
                comments={comments}
                approvalPage={approvalPage}
              />
            </p>

            {paragraphComments.length > 0 && (
              <div className="mt-3 space-y-3">
                {paragraphComments.map((comment) => (
                  <InlineRevisionCommentBlock
                    key={comment.id || `${index}-${comment.comment}`}
                    comment={comment}
                    showSelectedContent={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InlineRevisionCommentBlock({ comment, showSelectedContent = true }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-amber-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
            Text Marked for Revision
          </p>

          <p className="mt-1 text-xs font-semibold text-orange-700/90">
            The highlighted phrase above needs to be reviewed and updated.
          </p>
        </div>

        <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
          {comment.status || "Open"}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4">
        {showSelectedContent && comment.selectedText && (
          <div className="rounded-xl border border-amber-300 bg-white/70 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
                Selected JD Content
              </p>
            </div>

            <div className="flex min-h-[40px] items-center border-l-2 border-amber-400 pl-4">
              <HighlightedRevisionText value={comment.selectedText} />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-orange-100 bg-white px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

            <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>
          </div>

          <div className="flex min-h-[40px] items-center">
            <p className="whitespace-pre-line text-sm font-semibold leading-6 text-orange-800">
              {comment.comment || "No revision comment provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRichContent({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
  comments = [],
}) {
  const unmatchedComments = useMemo(
    () => getUnmatchedRevisionComments(value, comments),
    [value, comments],
  );

  if (!hasVisibleRichText(value) && !comments.length) {
    return (
      <p className="text-sm text-sibs-tertiary-5">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="jd-single-spaced-justified min-w-0 space-y-2 rounded-none border-0 bg-white px-0 py-0 text-justify">
      <DetailContentRenderer
        value={value}
        emptyText={emptyText}
        approvalPage={approvalPage}
        comments={comments}
      />

      {unmatchedComments.length > 0 && (
        <div className="space-y-3">
          {unmatchedComments.map((comment, index) => (
            <InlineRevisionCommentBlock
              key={getCommentUniqueKey(comment, index)}
              comment={comment}
              showSelectedContent={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}


export {
  DetailContentRenderer,
  DetailRichContent,
  HighlightedRevisionText,
  InlineCommentedText,
  InlineRevisionCommentBlock,
};
