export interface IEventPublisher<T> {
  publish(event: T): Promise<void>;
}
