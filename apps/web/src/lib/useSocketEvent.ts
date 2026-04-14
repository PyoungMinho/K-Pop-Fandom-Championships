"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

/**
 * 소켓 이벤트 중앙화 훅
 *
 * 사용 예시:
 *   useSocketEvent<ScoreUpdate>("score:update", handleScoreUpdate);
 *   useSocketEvent<ClickAck>("click:ack", handleClickAck, isReady);
 *
 * - handler를 useRef로 감싸 stale closure 방지
 * - enabled=false이면 리스너 등록하지 않음
 * - 컴포넌트 언마운트 시 자동으로 off 처리
 */
export function useSocketEvent<T = unknown>(
  eventName: string,
  handler: (data: T) => void,
  enabled: boolean = true,
): void {
  // handler를 ref로 감싸서 최신 참조 유지 (stale closure 방지)
  const handlerRef = useRef<(data: T) => void>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    const stableListener = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(eventName, stableListener);

    return () => {
      socket.off(eventName, stableListener);
    };
  }, [eventName, enabled]);
}
