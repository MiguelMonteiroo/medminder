import {View, Text} from 'react-native'

type Props = {
    name: string;
    dosage: string;
}

export function MedicationCard({name, dosage} : Props){
    return(
        <View>
            <Text>{name}</Text>
            <Text>{dosage}</Text>
        </View>
    )
}