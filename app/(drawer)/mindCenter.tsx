import { Redirect } from 'expo-router';

/** Legacy route — Mind Center hub lives at /(drawer)/mental */
export default function MindCenterRedirect() {
  return <Redirect href="/(drawer)/mental" />;
}
