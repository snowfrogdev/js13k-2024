import { Player } from "./player";

const eventBus = new Comment("event-bus");

type EventsDefinition = {
  PLAYER_DAMAGED: { damage: number };
  PLAYER_INCAPACITATED: { player: Player };
  ENEMY_KILLED: undefined; // Using 'undefined' for events without payloads
  BASE_DAMAGED: { damage: number };
  RESEARCH_MATERIAL_COLLECTED: { amount: number };
};

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
  const event = payload
    ? new CustomEvent(eventName, { detail: payload })
    : new Event(eventName);
  eventBus.dispatchEvent(event);
}

type Unsubscribe = () => void;

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
