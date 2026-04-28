"use client";

import checkoutImage from "../../../../../public/checkout.png";

import { useState } from "react";
import { ApiOutputs } from "@convex/api";
import { formatDistanceToNow } from "date-fns";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { useInfiniteQuery } from "better-convex/react";
import { GoComment, GoHeart, GoHeartFill } from "react-icons/go";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { 
  Dialog, 
  DialogContent, 
  DialogHidden,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { Id } from "../../../../../convex/functions/_generated/dataModel";

export const FeedTransactions = () => {
  const crpc = useCRPC();

  const { 
    data: feeds,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(crpc.transaction.feeds.infiniteQueryOptions());
  
  const like = useMutation(crpc.transaction.like.mutationOptions());

  return (
    <section className="flex flex-col gap-4">
      <header className="data-[show=false]:hidden grid content-start gap-3">
        <div className="flex items-center gap-2 h-8">
          <h2 className="text-lg font-normal leading-[1.3]">
            SMART Culture Feed
          </h2>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {feeds.length > 0 ? feeds.map((feed) => (
          <FeedItem 
            key={feed._id} 
            amount={feed.amount}
            senderName={feed.sender.name}
            senderImage={feed.sender.image}
            receiverName={feed.receiver.name}
            message={feed.message}
            likes={feed.likes.count}
            comments={feed.comments}
            createdAt={feed.createdAt}
            tags={feed.tags}
            transactionId={feed._id}
            likedByCurrentUser={feed.likes.likedByCurrentUser}
            onLike={() => like.mutate({ transactionId: feed._id })}
          />
        )) : (
          <div className="grid gap-8 p-4 md:p-8">
            <div className="grid justify-items-center gap-3 rounded border-2 border-dashed border-border bg-background p-6 text-center [&>.icon]:text-xl">
              <figure className="w-full">
                <img src={checkoutImage.src} alt="Checkout" className="w-full rounded-xs" />
              </figure>
              <h3 className="text-lg font-normal leading-snug">คุณยังไม่ได้เพิ่มอะไรเลย...ในตอนนี้!</h3>
              <p>เมื่อคุณทำแล้ว รายการจะแสดงขึ้นที่นี่เพื่อให้คุณดำเนินการสั่งซื้อให้เสร็จสมบูรณ์</p>
            </div>
          </div>
        )}

        {hasNextPage && (
          <Button variant="outline" onClick={() => fetchNextPage()}>
            ดูเพิ่มเติม
          </Button>
        )}
      </div>
    </section>
  );
}

const FeedItem = ({
  amount,
  message,
  senderName,
  senderImage,
  receiverName,
  likes,
  comments,
  createdAt,
  onLike,
  tags,
  transactionId,
  likedByCurrentUser,
}: {
  transactionId: Id<"transaction">;
  amount: number;
  senderName: string;
  senderImage: string | null;
  receiverName: string;
  message: string;
  likes: number;
  comments: ApiOutputs["transaction"]["feeds"]["page"][0]["comments"];
  createdAt: number;
  onLike: () => void; 
  tags?: string | null;
  likedByCurrentUser: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="flex flex-col rounded-xs border-2 border-border bg-background select-none">
      <div className="flex items-center px-4">
        <UserAvatar 
          name={senderName}
          src={senderImage || undefined}
          className={{
            container: "size-12 after:border-2! after:rounded-full!",
            fallback: "text-xl font-medium rounded-full!",
          }}
        />
        <div className="flex flex-col py-2 px-4 gap-1">
          <p className="text-sm md:text-base font-bold whitespace-pre-wrap wrap-break-word">
            {senderName} <span className="font-normal text-muted-foreground mx-1">gave <u>{amount}</u> points to</span> <span className="text-blue">{receiverName}</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground rounded-lg bg-muted px-2 py-1">
              <div className="size-2 rounded-full bg-orange shrink-0" />
              {tags}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="bg-muted rounded-r-lg rounded-bl-lg p-4">
          <div className="text-sm whitespace-pre-wrap wrap-anywhere">{message}</div>
        </div>
      </div>

      <footer className="flex items-center justify-between border-border border-t-2">
        <div className="flex items-center gap-2 py-2 px-4 border-border border-r-2">
          <Button variant="outline" size="xs" className="border-none" onClick={onLike}>
            {likedByCurrentUser ? <GoHeartFill className="stroke-[0.25] text-destructive" /> : <GoHeart className="stroke-[0.25]" />}
            {likes}
          </Button>
          <Button variant="outline" size="xs" className="border-none" onClick={() => setIsOpen(true)}>
            <GoComment className="stroke-[0.25]" />
            {comments.length}
          </Button>
          <FeedDialog 
            isOpen={isOpen} 
            onOpenChange={setIsOpen} 
            amount={amount}
            senderName={senderName}
            senderImage={senderImage}
            receiverName={receiverName}
            message={message}
            likes={likes}
            comments={comments}
            createdAt={createdAt}
            tags={tags}
            onLike={onLike}
            transactionId={transactionId}
            likedByCurrentUser={likedByCurrentUser}
          />
        </div>
        <div className="text-sm py-2 px-4">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      </footer>
    </article>
  );
}

export const FeedDialog = ({
  isOpen,
  onOpenChange,
  amount,
  senderName,
  senderImage,
  receiverName,
  message,
  likes,
  comments,
  createdAt,
  tags,
  onLike,
  transactionId,
  likedByCurrentUser,
}: {
  isOpen: boolean;
  amount: number;
  senderName: string;
  senderImage: string | null;
  receiverName: string;
  message: string;
  likes: number;
  comments: ApiOutputs["transaction"]["feeds"]["page"][0]["comments"];
  createdAt: number;
  tags?: string | null;
  onLike: () => void; 
  onOpenChange: (open: boolean) => void;
  transactionId: Id<"transaction">;
  likedByCurrentUser: boolean;
}) => {
  const crpc = useCRPC();

  const { data: currentUser } = useSuspenseQuery(crpc.user.getCurrentUser.queryOptions());

  const [comment, setComment] = useState("");

  const addComment = useMutation(crpc.transaction.comment.mutationOptions());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-md! sm:max-w-md! p-0 gap-0">
        <DialogHidden />
        <div className="flex items-center px-4">
          <UserAvatar 
            name={senderName}
            src={senderImage || undefined}
            className={{
              container: "size-12 after:border-2! after:rounded-full!",
              fallback: "text-xl font-medium rounded-full!",
            }}
          />
          <div className="flex flex-col py-2 px-4 gap-1">
            <p className="text-sm md:text-base font-bold whitespace-pre-wrap wrap-break-word">
              {senderName} <span className="font-normal text-muted-foreground mx-1">gave <u>{amount}</u> points to</span> <span className="text-blue">{receiverName}</span>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground rounded-lg bg-muted px-2 py-1">
                <div className="size-2 rounded-full bg-orange shrink-0" />
                {tags}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-muted rounded-r-lg rounded-bl-lg p-4">
            <div className="text-sm whitespace-pre-wrap wrap-anywhere">{message}</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-border border-t-2">
          <div className="flex items-center gap-2 py-2 px-4 border-border border-r-2">
            <Button variant="outline" size="xs" className="border-none" onClick={onLike}>
              {likedByCurrentUser
                ? <GoHeartFill className="stroke-[0.25] text-destructive" /> 
                : <GoHeart className="stroke-[0.25]" />
              }
              {likes}
            </Button>
          </div>
          <div className="text-sm py-2 px-4">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        </div>
        <div className="flex items-center justify-between border-border border-t-2">
          <div className="max-h-[300px] overflow-y-auto py-4 px-4">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment._id} className="flex flex-row relative outline-none self-start gap-3">
                <UserAvatar 
                  name={comment.author.name}
                  src={comment.author.image || undefined}
                  className={{
                    container: "size-5 after:border-[1.5px]",
                    fallback: "text-xs font-normal",
                  }}
                />
                <div className="flex flex-col gap-1">
                  <div className="bg-muted max-w-full my-0 rounded-bl-lg rounded-r-lg whitespace-normal inline-block relative wrap-break-word px-3 py-2">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <div className="text-xs whitespace-pre-wrap wrap-anywhere">{comment.content}</div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="grid gap-8 p-4 md:px-10">
                <div className="grid justify-items-center gap-3 rounded border-2 border-dashed border-border bg-background p-6 text-center [&>.icon]:text-xl">
                  <figure className="w-full">
                    <img src={checkoutImage.src} alt="Checkout" className="w-full rounded-xs" />
                  </figure>
                  <h3 className="text-lg font-normal leading-snug">ยังไม่มีความคิดเห็น</h3>
                  <p>เริ่มแสดงความคิดเห็นเป็นคนแรก</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <footer className="border-border border-t-2">
          <div className="flex items-center grow p-2">
            <div className="shrink-0 grow-0 me-2.5 self-start my-1">
              <UserAvatar
                name={currentUser.name}
                src={currentUser.image || undefined}
                className={{
                  container: "size-8 after:border-2 after:rounded-full!",
                  fallback: "text-sm font-medium rounded-full!",
                }}
              />
            </div>
            <div className="flex flex-wrap self-center relative justify-end text-sm cursor-text bg-transparent items-center gap-y-1 gap-x-1.5 p-1 w-full">
              <div className="grow flex min-h-6 pt-0.5">
                <textarea
                  rows={1}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="max-w-full w-full whitespace-pre-wrap wrap-break-word text-sm p-0.5 -m-0.5 leading-5 overflow-hidden focus-visible:outline-none resize-none h-full field-sizing-content break-all"
                />
              </div>
              <div className="flex flex-col-reverse items-end w-min">
                <div className="flex flex-row items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addComment.mutate({ transactionId, content: comment })}
                    className={cn(
                      "select-none transition-all inline-flex opacity-40 items-center justify-center shrink-0 rounded size-6 p-0",
                      !!comment && "opacity-100 hover:bg-[#298bfd10]",
                    )}
                  >
                    <BsArrowUpCircleFill
                      className={cn(
                        "size-5",
                        !!comment ? "text-blue" : "text-muted",
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}