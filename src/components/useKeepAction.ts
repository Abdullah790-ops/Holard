"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like useActionState, but keeps what the user typed when the server returns an error.
 * (React 19 resets <form action={...}> fields after every submission.)
 */
export function useKeepAction<S>(action: (state: S, fd: FormData) => Promise<S>, initial: S) {
  const [state, dispatch, pending] = useActionState<S, FormData>(action as (s: Awaited<S>, fd: FormData) => Promise<S>, initial as Awaited<S>);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter && submitter.getAttribute("name") ? submitter : null);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
