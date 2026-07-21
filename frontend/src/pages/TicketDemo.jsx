import TicketCard from '../components/TicketCard';

export default function TicketDemo() {
  return (
    <TicketCard
      orgLogoText="ISCAE"
      eventTitle="Cérémonie de Fin d'Études"
      eventSubtitle="Licence 2026 – ISCAE"
      qrValue="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      qrCenterInitial="T"
      guestName="Amina Diop"
      date="15 Juin 2026"
      time="14:00 GMT"
      locationLine1="Palais des Congrès"
      locationLine2="Nouakchott"
    />
  );
}
