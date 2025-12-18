trigger CommunicationTrigger on Communication__c (after insert, after update) {
	if(Trigger.isInsert) {
        if(Trigger.isAfter) {
            List<Communication__c> communicationList = new List<Communication__c>();
            for(Communication__c comm : Trigger.New){
                if(comm.Medium_of_Communication__c=='chat' && comm.Is_Inbound__c){
                    communicationList.add(comm);
                }
            }
            system.debug('communicationList: '+communicationList);
            if(!communicationList.isEmpty()){
                PublishPlatformEvent_Communication.Publish_for_chat(communicationList);
            }
        }
    }
    if(Trigger.isUpdate){
        if(Trigger.isAfter){
            List<Communication__c> communicationList = new List<Communication__c>();
            for(Communication__c comm : Trigger.NewMap.values()){
                if(comm.Medium_of_Communication__c=='call' && comm.Status__c!=Trigger.OldMap.get(comm.Id).Status__c){
                    communicationList.add(comm);
                }
            }
            if(!communicationList.isEmpty()){
                PublishPlatformEvent_Communication.Publish_for_call(communicationList);
            }
        }
    }
}