import { keys } from 'ts-transformer-keys';

interface Person {
  name: string;
}
const a = keys<Person>();
