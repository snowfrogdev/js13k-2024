import { Player } from "./player";

const eventBus = new Comment("event-bus");

type EventsDefinition = {
  BASE_DAMAGED: { damage: number };
  BASE_DESTROYED: undefined;
  BUTTON_CLICKED: { buttonId: string };
  ENEMY_KILLED: undefined; // Using 'undefined' for events without payloads
  PLAYER_DAMAGED: { damage: number };
  PLAYER_INCAPACITATED: { player: Player };
  RESEARCH_COMPLETED: undefined;
  RESEARCH_MATERIAL_COLLECTED: { amount: number };
};

export const EVENTS: { [K in keyof EventsDefinition]: K } = {
  BASE_DAMAGED: "BASE_DAMAGED",
  BASE_DESTROYED: "BASE_DESTROYED",
  BUTTON_CLICKED: "BUTTON_CLICKED",
  ENEMY_KILLED: "ENEMY_KILLED",
  PLAYER_DAMAGED: "PLAYER_DAMAGED",
  PLAYER_INCAPACITATED: "PLAYER_INCAPACITATED",
  RESEARCH_COMPLETED: "RESEARCH_COMPLETED",
  RESEARCH_MATERIAL_COLLECTED: "RESEARCH_MATERIAL_COLLECTED",
} as const;

type EventsWithPayload = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? never : K;
}[keyof EventsDefinition];

type EventsWithoutPayload = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? K : never;
}[keyof EventsDefinition];

// Function overloads for events with and without payloads
export function publish<T extends EventsWithPayload>(eventName: T, payload: EventsDefinition[T]): void;
export function publish<T extends EventsWithoutPayload>(eventName: T): void;

export function publish<T extends keyof EventsDefinition>(eventName: T, payload?: EventsDefinition[T]): void {
  const event = payload ? new CustomEvent(eventName, { detail: payload }) : new CustomEvent(eventName);
  eventBus.dispatchEvent(event);
}

export type Unsubscribe = () => void;

function isCustomEvent(event: Event): event is CustomEvent {
  return "detail" in event;
}

export function subscribe<T extends keyof EventsDefinition>(
  eventName: T,
  handlerFn: (payload: EventsDefinition[T]) => void
): Unsubscribe {
  const eventHandler = (event: Event) => {
    if (isCustomEvent(event)) {
      const eventPayload: EventsDefinition[T] = event.detail;
      handlerFn(eventPayload);
    }
  };
  eventBus.addEventListener(eventName, eventHandler);
  return () => {
    eventBus.removeEventListener(eventName, eventHandler);
  };
}
