const eventBus = new Comment("event-bus");

type EventsDefinition = {
  PLAYER_DAMAGED: { damage: number };
  PLAYER_INCAPACITATED: void;
  ENEMY_KILLED: void;
  BASE_DAMAGED: { damage: number };
  RESEARCH_MATERIAL_COLLECTED: { amount: number };
};

type Events = keyof EventsDefinition;

export function publish<T extends Events>(eventName: T, payload?: EventsDefinition[T]): void {
  const event = payload ? new CustomEvent(eventName, { detail: payload }) : new Event(eventName);
  eventBus.dispatchEvent(event);
}

type Unsubscribe = () => void;

function isCustomEvent(event: Event): event is CustomEvent {
  return "detail" in event;
}

export function subscribe<T extends Events>(eventName: T, handlerFn: (payload: EventsDefinition[T]) => void): Unsubscribe {
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
