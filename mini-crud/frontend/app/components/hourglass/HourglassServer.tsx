import HourglassClient from './HourglassClient';
import { getKstMinutesPassed } from './timezone';

export default function HourglassServer() {
  const initialMinutesPassed = getKstMinutesPassed(new Date());

  return (
    <section>
      <HourglassClient initialMinutesPassed={initialMinutesPassed} />
    </section>
  );
}
