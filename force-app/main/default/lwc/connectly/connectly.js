import { LightningElement, track, api, wire } from 'lwc';
import loading_img3 from '@salesforce/resourceUrl/loading_img3';
import whatsapplogo from '@salesforce/resourceUrl/whatsapp';
import whatsappbackground from '@salesforce/resourceUrl/whatsappbackground';
import whatsappSVG from '@salesforce/resourceUrl/whatsappSVG';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import TITLE from '@salesforce/schema/Lead.Title';
import COMPANY from '@salesforce/schema/Lead.Company';
import NAME from '@salesforce/schema/Lead.Name';
import PHONE from '@salesforce/schema/Lead.Phone';
import EMAIL from '@salesforce/schema/Lead.Email';
import get_details from '@salesforce/apex/ConnectlyController.get_details';
import connect from '@salesforce/apex/ConnectlyController.connect';
import rephrase from '@salesforce/apex/ConnectlyController.rephrase';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Connectly extends LightningElement {
    @api recordId;
    @track showLoading = false;
    loadingGif = loading_img3;
    whatsapp_logo = whatsapplogo;
    whatsapp_SVG = whatsappSVG;
    whatsappbackground=whatsappbackground;
    @track composer = { isVisible: false, isOpen: true };
    @wire(getRecord, { recordId: '$recordId', fields: [TITLE, COMPANY, NAME, PHONE, EMAIL] })
    lead;

    communications;

    @track records = {
        chat : [],
        whatsapp : []
    }

    @track channelManagement = { call: false, email: false, chat: false, whatsapp: false };

    channelName = '/event/Chat_Update_Event__e';
    subscription = {};

    get headerIconName() {
        if (this.channelManagement.call) {
            return 'utility:call';
        }
        else if (this.channelManagement.email) {
            return 'utility:email';
        }
        else if (this.channelManagement.chat) {
            return 'utility:slack_thread';
        }else if (this.channelManagement.whatsapp) {
            return 'standard:whatsapp';
        }
    }
    get headerTitle() {
        if (this.channelManagement.call) {
            return 'Calling...';
        }
        else if (this.channelManagement.email) {
            return 'New Email';
        }
        else if (this.channelManagement.chat) {
            return 'Lets Chat';
        }else if (this.channelManagement.whatsapp) {
            return 'Whatsapp';
        }
    }
    changeChannel(channel) {
        for (const key in this.channelManagement) {
            if (key === channel) {
                this.channelManagement[key] = true;
            }
            else {
                this.channelManagement[key] = false;
            }
        }
    }
    scrollToBottom() {
        console.log('scrollToBottom');
        const container = this.template.querySelector('.scroll-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    async get_details(channel) {
        try {
            this.communications = await get_details({ channel: channel, sourceId: this.recordId });
            let datecounter;
            
            this.communications.forEach(element => {
                console.log('element Name: ' + element.Name);
                let time = '';
                if (element.CreatedDate) {
                    //const jsdate = new Date(element.CreatedDate);
                    const datestr = this.getDateString(element.CreatedDate);
                    console.log(this.process_dates(datestr));
                    time = this.getTimeString(element.CreatedDate);
                    
                    if(datestr!=datecounter || (!datecounter)){
                        datecounter=datestr;

                        this.records[channel].push({
                            id: datestr,
                            content: this.process_dates(datestr),
                            DateTime: element.CreatedDate,
                            class_li: 'slds-chat-listitem slds-chat-listitem_event',
                            isEvent: true
                        })
                        
                    }
                }
                this.records[channel].push({
                    id: element.Id,
                    content: element.Content__c,
                    DateTime: time,
                    class_li: element.Is_Inbound__c ? 'slds-chat-listitem slds-chat-listitem_inbound' : 'slds-chat-listitem slds-chat-listitem_outbound',
                    class_div: element.Is_Inbound__c ? 'slds-chat-message__text slds-chat-message__text_inbound' : 'slds-chat-message__text slds-chat-message__text_outbound',
                    isEvent: false
                });
                
            });
            console.log('data added: ' + this.communications);
            console.log('chat_records: ' + JSON.stringify(this.records));
        } catch (error) {
            console.log('error fetching details');
            console.error('error: ' + error);
        }

        //subscribe platform events
        console.log('call subscribeChatEvent method');
        this.subscribeChatEvent();
        //change channel
        this.changeChannel(channel);
        //Scroll to bottom
        this.scrollToBottom();
        //Show the docked composer
        this.showComposer();
        //hide loading image
        this.hideloading();
    }

    process_dates(dt) {
        const todayDate = new Date();
        console.log('today=' + todayDate.toLocaleDateString() + ' dt=' + dt);
        if (dt == new Date().toLocaleDateString()) {
            console.log('returning today');
            return 'Today';
        }
        else if (dt == new Date(todayDate.setDate(todayDate.getDate() - 1)).toLocaleDateString()) {
            console.log('returning yesterday');
            return 'Yesterday';
        }
        else {
            console.log('returning the date itself');
            return dt;
        }
    }

    getDateString(date_){
        const jsdate = new Date(date_);
        return jsdate.toLocaleDateString();
    }
    getTimeString(date_){
        const jsdate = new Date(date_);
        return jsdate.toLocaleTimeString();
    }

    fetcha_details(channel) {
        console.log('data present: ' + this.communications);
        console.log('record length:'+this.records[channel].length)
        //If we did not fetched the data
        if (this.records[channel].length==0) {
            console.log('fetch data');
            //first display the loading text
            this.displayloading();
            //call the function to fetch the data
            this.get_details(channel);
            console.log('get details Ran');
        } else {//if we already have the data
            console.log('data already fetched');
            //just change the channel
            this.changeChannel(channel);
            this.showComposer();
        }
    }

    onbuttonClick(event) {
        console.log('channel:' + event.target.name);
        const name = event.target.name;
        if (name === 'chat' || name === 'whatsapp') {
            this.fetcha_details(event.target.name);
        } else {
            this.changeChannel(event.target.name);

            this.showComposer();
        }


    }
    showComposer() {
        if (!this.composer.isVisible) {
            this.composer.isVisible = true;
        }
        if (!this.composer.isOpen) {
            this.composer.isOpen = true;
        }
    }
    connectedCallback() {
        console.log('11:58');
        console.log('composerclass:' + this.composerClass);
        console.log('Lead data:' + JSON.stringify(this.lead));
    }

    get composerClass() {
        return this.composer.isOpen ? 'slds-docked-composer slds-grid slds-grid_vertical slds-is-open' : 'slds-docked-composer slds-grid slds-grid_vertical slds-is-closed';
    }
    isMenuOpen = false;
    get more_Menu(){
        return this.isMenuOpen ? 'slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-dropdown-trigger slds-dropdown-trigger_click slds-is-closed';
    }
    onMenuClick(event){
        this.isMenuOpen = !this.isMenuOpen;
    }

    displayloading() {
        this.showLoading = true;

    }

    hideloading() {
        //setTimeout(() => {
        this.showLoading = false;
        //}, 500);
    }

    Options = [{ label: 'Option 1', value: 'Option 1' }, { label: 'Option 2', value: 'Option 2' },
    { label: 'Option 3', value: 'Option 3' }];

    onHeaderButtonClick(event) {
        console.log('button name: ' + event.target.name);
        if (event.target.name === 'close') {
            this.composer.isVisible = false;
        } else {
            this.composer.isOpen = event.target.name === 'minimize' ? false : true;
        }
        console.log('isOpen: ' + this.composer.isOpen);
    }

    //Lead data fields
    get title() {
        return getFieldValue(this.lead.data, TITLE);
    }
    get company() {
        return getFieldValue(this.lead.data, COMPANY);
    }
    get name() {
        return getFieldValue(this.lead.data, NAME);
    }

    IsTodayEventAvailable(channel){
        let arr = this.records[channel];
        for(let i= arr.length-1; i>=0 ; i--){
            if(arr[i].isEvent){
                if(arr[i].content==='Today'){
                    return true;
                }
                break;
            }
        }
        return false;
    }

    //Platform Event
    subscribeChatEvent() {
        console.log('subscribing emp api: ' + this.channelName);
        onError(error => console.log('EmpApi error->' + error));

        const messageCallback = (response) => {
            console.log('response: ' + JSON.stringify(response));
            const payload = response.data.payload;
            console.log('payload: ' + JSON.stringify(payload));
            if (payload.SessionId__c == this.recordId) {
                if(this.IsTodayEventAvailable(chnl)){
                    this.records[payload.Channel__c] = [
                        ...this.records[payload.Channel__c],
                        {
                            id: this.getDateString(new Date()),
                            content: 'Today',
                            DateTime: this.getTimeString(payload.CreatedDate),
                            class_li: 'slds-chat-listitem slds-chat-listitem_event',
                            isEvent: true
                        }
                    ]
                }
                this.records[payload.Channel__c] = [
                    ...this.records[payload.Channel__c],
                    {
                        id: payload.RecordId__c,
                        content: payload.Message__c,
                        DateTime: this.getTimeString(payload.CreatedDate),
                        class_li: 'slds-chat-listitem slds-chat-listitem_inbound',
                        class_div: 'slds-chat-message__text slds-chat-message__text_inbound',
                        isEvent: false
                    }
                ]
                console.log('last element: ' + JSON.stringify(this.chat_records[-1]));
                this.scrollToBottom();
            }
        }

        subscribe(this.channelName, -1, messageCallback.bind(this)).then(response => {
            this.subscription = response;
            console.log(
                'Subscription request sent to: ',
                JSON.stringify(response.channel)
            );
        }).catch(error => {
            console.log('subscribe error:' + error);
        });
    }

    disconnectedCallback() {
        if (this.subscription) {
            // unsubscribe from the event channel
            unsubscribe(this.subscription);
        }
    }
    renderedCallback() {
        const container = this.template.querySelector('.scroll-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    @track message = '';
    handleMessageChange(event) {
        this.message = event.detail.value;
    }
    async sendMessage(chnl) {
        console.log('sendMessage-> this.message: ' + this.message);
        if (this.message) {
            let insertedRecordId = '';
            let Date_time = this.getTimeString(new Date());
            await connect({
                channel: chnl, 
                sourceId: this.recordId,
                content: this.message, 
                Phone: '7894561230'
            })
                .then(result => {
                    insertedRecordId = result;
                    console.log('insertedRecordId: ' + insertedRecordId);
                    Date_time = Date_time+' • Sent';
                })
                .catch(error => {
                    console.log('error while connect: ' + error);
                    insertedRecordId = new Date().toISOString();
                    Date_time =Date_time+' • Failed';
                })
                if(!this.IsTodayEventAvailable(chnl)){
                    this.records[chnl] = [
                        ...this.records[chnl],
                        {
                            id: this.getDateString(new Date()),
                            content: 'Today',
                            DateTime: Date_time,
                            class_li: 'slds-chat-listitem slds-chat-listitem_event',
                            isEvent: true
                        }
                    ]
                }
            this.records[chnl] = [
                ...this.records[chnl],
                {
                    id: insertedRecordId,
                    content: this.message,
                    DateTime: Date_time,
                    class_li: 'slds-chat-listitem slds-chat-listitem_outbound',
                    class_div: 'slds-chat-message__text slds-chat-message__text_outbound',
                    isEvent: false
                }
            ]
            this.message = '';
        }
    }
    handleSend(event) {
        console.log('handleEnter: '+event.target.value);
        console.log('hamdleEnter-> this.message: ' + this.message);
        this.sendMessage(event.target.name);
    }
    isAIinAction=false;
    GenerateWithAI(event){
        console.log(event);
        console.log('generate with A method');
        console.log('message->'+this.message);
        
        /*this.isAIinAction = true;
        setTimeout(() => {
            this.isAIinAction = false;
        }, 2000);*/

        if(this.message){
            this.isAIinAction=true;
            rephrase({message : this.message})
            .then(result => {
                if(result){
                    console.log('result->'+result);
                    this.message=result
                }
            })
            .catch(error => {
                console.log('error generating with AI'+error);
            })
            .finally(() => {
                this.isAIinAction=false;
            });
            
        }
    }
    onWhatsappClick() {
        const evt = new ShowToastEvent({
            title: 'Whatsapp feature has not been activated.',
            message: '',
            variant: 'info',
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
    }
    isCallConfirmed=false;
    confirmingCall(){
        this.isCallConfirmed=true;
    }
    ispanelOpen=false;
    openActivityTimeline(){
        this.ispanelOpen=true;
    }
    get panelClass(){
        return this.ispanelOpen ? 'slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-is-open' : 'slds-panel slds-size_medium slds-panel_docked slds-panel_docked-left slds-is-closed';
    }
    closePanel(event){
        console.log('closing panel');
        this.ispanelOpen=false;
    }
}